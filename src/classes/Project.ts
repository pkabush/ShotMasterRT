// Project.ts
import { Scene } from "./Scene";
import { Artbook } from "./Artbook";
import { UserSettingsDB } from "./UserSettingsDB";
import { makeAutoObservable, runInAction } from "mobx";
import { Script } from "./Script";
import { GoogleAI } from "./GoogleAI";
import { ChatGPT } from "./ChatGPT";


export class Project {
  rootDirHandle: FileSystemDirectoryHandle | null = null;
  scenes: Scene[] = [];
  artbook: Artbook | null = null;
  script: Script | null = null;         // <--- Added
  userSettingsDB = new UserSettingsDB();

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
      const scenesFolder = await this.rootDirHandle.getDirectoryHandle("SCENES",{create:true});

      const loadedScenes: Scene[] = [];

      for await (const entry of scenesFolder.values()) {
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
      const refsFolder = await this.rootDirHandle.getDirectoryHandle("REFS",{create:true});
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
      const script = new Script(scriptFileHandle,this);
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
    GoogleAI.getApiKey = () => {return this.userSettingsDB.data.api_keys.Google_API_KEY || null;};
    GoogleAI.setApiKey = async (key: string) => { await this.userSettingsDB.update(data => { data.api_keys.Google_API_KEY = key; });}
    ChatGPT.getApiKey = () => {return this.userSettingsDB.data.api_keys.GPT_API_KEY || null; };
    ChatGPT.setApiKey = async (key: string) => {await this.userSettingsDB.update(data => {data.api_keys.GPT_API_KEY = key;  });  };

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
}


