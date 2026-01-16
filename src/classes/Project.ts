// Project.ts
import { Scene } from "./Scene";
import { Artbook } from "./Artbook";
import { UserSettingsDB } from "./UserSettingsDB";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { Script } from "./Script";
import { GoogleAI } from "./GoogleAI";
import { ChatGPT } from "./ChatGPT";
import { LocalJson } from './LocalJson';
import { KlingAI } from "./KlingAI";

export type ProjectView =
  | { type: "none" }
  | { type: "settings" }
  | { type: "script" }
  | { type: "artbook" }
  | { type: "scene" };

const default_projinfo = {
  "gpt_model": "gpt-4o-mini",
  "describe_prompt": "Хорошо Опиши этого персонажа как промпт для генерации картинки. ",
  "generate_tags_prompt": `
  Опираясь на сценарий (SCRIPT) и шоты из этого сценария(SHOTS JSON) сделай список какие из референсных картинок из REFS DICTIONARY стоит использовать в этой сцене.

  в ответе предоставь список, где путь к каждой картинке с новой строки, без дополнительных комментариев в таком виде:
  ENV/ROOM1/Night.png
  CHAR/VICTOR/Portrait.png


  `,
  "split_shot_prompt": `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}`,
  prompt_presets: {
    split_shots: {
      model: "gpt-4o",
      prompt: `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}`,
      system_message: "You are a helpful assistant. " +
        "Always respond using ONLY valid JSON. " +
        "Do not write explanations. " +
        "Do not wrap the JSON in backticks. " +
        "The entire response must be a valid JSON object.",

    },
    generate_tags: {
      model: "gpt-4o",
      prompt: "Generate Tags ",
      system_message: "You are a tagger "
    }
  },
  workflows: {
    generate_shot_image: {
      model: "gemini-2.5-flash-image",
    },
    split_scene_into_shots: {
      model: "gpt-4o-mini",
      prompt: `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}`,
      system_message: "You are a helpful assistant. " +
        "Always respond using ONLY valid JSON. " +
        "Do not write explanations. " +
        "Do not wrap the JSON in backticks. " +
        "The entire response must be a valid JSON object.",
    },
    generate_video_kling: {
      model: KlingAI.options.img2video.model.v2_6,
      mode:KlingAI.options.img2video.mode.std,
      duration:KlingAI.options.img2video.duration.five,
    },
    kling_motion_control: {
      mode: KlingAI.options.motion_control.mode.std,
      character_orientation: KlingAI.options.motion_control.character_orientation.image,
      keep_original_sound: KlingAI.options.motion_control.keep_original_sound.no,
    }


  },

}


export class Project {
  rootDirHandle: FileSystemDirectoryHandle | null = null;
  scenes: Scene[] = [];
  artbook: Artbook | null = null;
  script: Script | null = null;         // <--- Added
  userSettingsDB = new UserSettingsDB();
  projinfo: LocalJson | null = null;
  currentView: ProjectView = { type: "none" };
  selectedScene: Scene | null = null;

  constructor(rootDirHandle: FileSystemDirectoryHandle | null = null) {
    this.rootDirHandle = rootDirHandle;
    makeAutoObservable(this);
  }

  async loadFromFolder(handle: FileSystemDirectoryHandle) {
    if (!handle) return;

    // Set root directory
    this.rootDirHandle = handle;

    // Update database (recent folders, last opened)
    runInAction(async () => {
      this.userSettingsDB.data.lastOpenedFolder = handle;

      const isAlreadyRecent = await Promise.all(
        this.userSettingsDB.data.recentFolders.map(async (h) => {
          try {
            return await h.isSameEntry(handle);
          } catch {
            return false;
          }
        })
      );

      if (!isAlreadyRecent.includes(true)) {
        this.userSettingsDB.data.recentFolders.push(handle);
        this.userSettingsDB.data.recentFolders =
          this.userSettingsDB.data.recentFolders.slice(-5);
      }

      await this.userSettingsDB.save();

      this.projinfo = await LocalJson.create(this.rootDirHandle as FileSystemDirectoryHandle, 'projinfo.json', default_projinfo);
    });

    // Load all project content
    await Promise.all([
      this.loadScenes(),
      this.loadArtbook(),
      this.loadScript(),
    ]);
  }

  async loadScenes() {
    if (!this.rootDirHandle) return;

    try {
      const scenesFolder = await this.rootDirHandle.getDirectoryHandle("SCENES", { create: true });

      const loadedScenes: Scene[] = [];

      for await (const entry of (scenesFolder as any).values()) {
        if (entry.kind === "directory") {
          const scene = new Scene(entry, this);
          await scene.load();
          loadedScenes.push(scene);
        }
      }

      runInAction(() => {
        this.scenes = loadedScenes;
      });

    } catch (err) {
      console.error("Error loading scenes:", err);
      runInAction(() => {
        this.scenes = [];
      });
    }
  }

  async loadArtbook() {
    if (!this.rootDirHandle) return;

    try {
      const refsFolder = await this.rootDirHandle.getDirectoryHandle("REFS", { create: true });
      const artbook = new Artbook(refsFolder, this);
      await artbook.load();

      runInAction(() => {
        this.artbook = artbook;
      });

    } catch (err) {
      console.error("Error loading artbook:", err);
      runInAction(() => {
        this.artbook = null;
      });
    }
  }

  async loadScript() {
    if (!this.rootDirHandle) return;

    try {
      // Get or create the script file
      const scriptFileHandle = await this.rootDirHandle.getFileHandle("script.txt", {
        create: true,
      });

      // Create Script object
      const script = new Script(scriptFileHandle, this);
      await script.load();

      runInAction(() => {
        this.script = script;
      });

    } catch (err) {
      console.error("Error loading script:", err);
      runInAction(() => {
        this.script = null;
      });
    }
  }

  async loadDB() {
    await this.userSettingsDB.load();
    // Init API Key Getter
    GoogleAI.getApiKey = () => { return this.userSettingsDB.data.api_keys.Google_API_KEY || null; };
    GoogleAI.setApiKey = async (key: string) => { await this.userSettingsDB.update(data => { data.api_keys.Google_API_KEY = key; }); }
    ChatGPT.getApiKey = () => { return this.userSettingsDB.data.api_keys.GPT_API_KEY || null; };
    ChatGPT.setApiKey = async (key: string) => { await this.userSettingsDB.update(data => { data.api_keys.GPT_API_KEY = key; }); };

    KlingAI.getKeysDict = () => {
      return {
        accessKey: this.userSettingsDB.data.api_keys.Kling_Acess_Key,
        secretKey: this.userSettingsDB.data.api_keys.Kling_Secret_Key
      }
    }




  }

  async createScene(sceneName: string) {
    if (!this.rootDirHandle) {
      console.error("No project folder open");
      return null;
    }

    const existingScene = this.scenes.find(s => s.folder.name === sceneName);
    if (existingScene) return existingScene;

    try {
      const scenesFolder = await this.rootDirHandle.getDirectoryHandle("SCENES", {
        create: true,
      });

      const newSceneFolder = await scenesFolder.getDirectoryHandle(sceneName, {
        create: true,
      });

      const scene = new Scene(newSceneFolder, this);
      await scene.load();

      runInAction(() => {
        const index = this.scenes.findIndex(
          (s) => s.folder.name.localeCompare(scene.folder.name) > 0
        );
        if (index === -1) {
          this.scenes.push(scene);
        } else {
          this.scenes.splice(index, 0, scene);
        }
      });

      return scene;

    } catch (err) {
      console.error("Failed to create scene:", err);
      return null;
    }
  }

  log() {
    console.log(toJS(this));
  }

  setView(view: ProjectView, scene: Scene | null = null) {
    this.currentView = view;
    this.selectedScene = scene;
  }

  get promptPresets() {
    if (!this.projinfo) return {};
    return this.projinfo.data.prompt_presets;
  }

  savePromptPreset(data: any) {
    runInAction(() => {
      if (!this.projinfo) return;
      this.projinfo.data.prompt_presets[data.preset] = data;
      this.projinfo?.save();
    })
  }

  get workflows() {
    return this.projinfo?.data.workflows;
  }


  updateWorkflow(workflow: string, key: string, value: string) {
    runInAction(() => {
      this.workflows[workflow][key] = value;
      this.projinfo?.save();
    })  
  }

  download_asset(path:string, name:string){
    const link = document.createElement("a");

    link.href = path;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


}


