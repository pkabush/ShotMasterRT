// Project.ts
import { Scene } from "./Scene";
import { Artbook } from "./Artbook";
import { UserSettingsDB } from "./UserSettingsDB";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { Script } from "./Script";
import { GoogleAI } from "./GoogleAI";
import { ChatGPT } from "./ChatGPT";
import { LocalJson } from './LocalJson';
import { KlingAI } from "./KlingAI";
import { LocalFolder } from "./fileSystem/LocalFolder";

export type ProjectView =
  | { type: "none" }
  | { type: "settings" }
  | { type: "script" }
  | { type: "artbook" }
  | { type: "scene" }
  | { type: "taskview" }
  | { type: "charview" };

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
      mode: KlingAI.options.img2video.mode.std,
      duration: KlingAI.options.img2video.duration.five,
      sound: KlingAI.options.img2video.sound.off,
    },
    kling_motion_control: {
      mode: KlingAI.options.motion_control.mode.std,
      character_orientation: KlingAI.options.motion_control.character_orientation.image,
      keep_original_sound: KlingAI.options.motion_control.keep_original_sound.no,
    },
    generate_character_variation_data: {
      "model": "gemini-3.1-flash-image-preview",
      "aspect_ratio": "16:9",
      "prompt": "Generate outfit Names and descriptions for image generation for my character based on my script, output them in a proper json like this:\n{\nOutfit_Name:\"description\"\nOutfit_Name:\"description\"\nOutfit_Name:\"description\"\n}\nCharacter to Use:"
    },
    artbook_generate_character_names: {
      "undefined": "Test",
      "prompt": "Based on my script Generate Chracter Names, output a simple list like this:\nCHARACTER1\nCHARACTER2\nCHARACTER3",
      "model": "gpt-5-mini"
    },
    generate_character_variation_image: {
      "prompt": "Based on my Script Generate an image for my character based on description",
      "aspect_ratio": "16:9",
      "model": "gemini-3-pro-image-preview"
    },
    artbook_generate_location_names: {
      "prompt": "Based on my script Generate Location Names, output a simple list like this:\nLocation1\nLocation2\nLocation3",
      "model": "gpt-5-mini"
    },
    generate_tags_for_scene: {
      "prompt": "Based on my scene and tags Generate TagsList to be use in this scene, output a simple list like this:\nTagPath1\nTagPath2\nTagPath3",
      "model": "gpt-5-mini"
    }

  },
}


export class Project extends LocalFolder {
  private static _instance: Project | null = null;

  static getProject(): Project {
    if (!Project._instance) {
      throw new Error("Project instance not initialized. Call constructor first.");
    }
    return Project._instance;
  }

  artbook: Artbook | null = null;
  script: Script | null = null;         // <--- Added
  userSettingsDB: UserSettingsDB;
  projinfo: LocalJson | null = null;
  currentView: ProjectView = { type: "none" };
  selectedScene: Scene | null = null;
  selectedPath: string = ""
  timelinesDirHandle: LocalFolder | null = null;
  id = 0;

  scenesLocalFolder: LocalFolder | null = null;

  constructor(parentFolder: FileSystemDirectoryHandle, userSettingsDB: UserSettingsDB) {
    super(null, parentFolder);
    if (Project._instance) this.id = Project._instance.id + 1;
    Project._instance = this;
    this.userSettingsDB = userSettingsDB;

    makeObservable(this, {
      parentFolder: observable,
      artbook: observable,
      script: observable,
      currentView: observable,
      selectedScene: observable,
      selectedPath: observable,
      loadFromFolder: action,
      loadScenes: action,
      setView: action,
      setScene: action,
      setArtbookItem: action,
      scenes: computed
    });
  }

  get scenes() {
    //console.log("Get Scenes",this.scenesLocalFolder?.getType(Scene));
    return this.scenesLocalFolder?.getType(Scene);
  }

  async loadFromFolder(handle: FileSystemDirectoryHandle) {
    if (!handle) return;

    // Set root directory
    this.handle = handle;
    this.path = "";
    this.timelinesDirHandle = await LocalFolder.open(this, 'Timelines');
    //await this.handle.getDirectoryHandle('Timelines', { create: true });

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

      this.projinfo = await LocalJson.create(this.handle as FileSystemDirectoryHandle, 'projinfo.json', default_projinfo);
    });

    // Load all project content
    await Promise.all([
      this.loadScenes(),
      this.loadArtbook(),
      this.loadScript(),
      this.loadDB(),
    ]);
  }

  async loadScenes() {
    if (!this.handle) return;

    try {
      const scenesFolder = await this.handle.getDirectoryHandle("SCENES", { create: true });
      this.scenesLocalFolder = new LocalFolder(this, scenesFolder);
      await this.scenesLocalFolder.load_subfolders(Scene);
    } catch (err) {
      console.error("Error loading scenes:", err);
    }
  }

  async loadArtbook() {
    if (!this.handle) return;

    try {
      const refsFolder = await this.handle.getDirectoryHandle("REFS", { create: true });
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
    if (!this.handle) return;

    try {
      // Get or create the script file
      const scriptFileHandle = await this.handle.getFileHandle("script.txt", {
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
    if (!this.handle) {
      console.error("No project folder open");
      return null;
    }

    const scene = LocalFolder.open(this.scenesLocalFolder, sceneName, Scene);
    return scene;
  }

  setView(view: ProjectView, scene: Scene | null = null) {
    //console.log("SET VIEW",scene,view)
    this.currentView = view;
    this.selectedScene = scene;
  }

  setArtbookItem(path: string) {
    this.currentView = { type: "charview" };
    this.selectedPath = path;
  }

  setScene(scene: Scene) {
    this.setView({ type: "scene" }, scene);
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
    return this.projinfo?.data.workflows as Record<string, Workflow>;
  }
  updateWorkflow(workflow: string, key: keyof Workflow, value: string) {
    runInAction(() => {
      if (!this.workflows[workflow]) { this.workflows[workflow] = {}; }
      this.workflows[workflow][key] = value;
      this.projinfo?.save();
    })
  }
  download_asset(path: string, name: string) {
    const link = document.createElement("a");

    link.href = path;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


export type Workflow = {
  model?: string;
  prompt?: string;
  aspect_ratio?: string;
  duration?: string;
  mode?: string;
  sound?: string;
  character_orientation?: string;
  keep_original_sound?: string;
  system_message?: string;
};