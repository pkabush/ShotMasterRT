// Project.ts
import { Scene } from "./Scene";
import { Artbook } from "./Artbook";

import { makeAutoObservable, runInAction } from "mobx";

export class Project {
  rootDirHandle: FileSystemDirectoryHandle | null = null;
  scenes: Scene[] = [];
  artbook: Artbook | null = null;

  constructor(rootDirHandle: FileSystemDirectoryHandle | null = null) {
    this.rootDirHandle = rootDirHandle;
    makeAutoObservable(this);
  }

  async load() {
    if (!this.rootDirHandle) return;
    await Promise.all([
      this.loadScenes(),
      this.loadArtbook()
    ]);
  }

  async loadScenes() {
    if (!this.rootDirHandle) return;

    try {
      const scenesFolder = await this.rootDirHandle.getDirectoryHandle("SCENES");

      const loadedScenes: Scene[] = [];
      for await (const entry of scenesFolder.values()) {
        if (entry.kind === "directory") {
          const scene = new Scene(entry,this);
          await scene.load();
          loadedScenes.push(scene);
        }
      }

      // Mutate observable array inside an action
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
      // Get REFS folder
      const refsFolder = await this.rootDirHandle.getDirectoryHandle("REFS");
      // Create new Artbook
      const artbook = new Artbook(refsFolder,this);
      // Load its content
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

  setRootDirHandle(handle: FileSystemDirectoryHandle) {
    this.rootDirHandle = handle;
  }
}
