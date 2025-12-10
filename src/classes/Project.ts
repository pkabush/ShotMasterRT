// Project.ts
import { Scene } from "./Scene";

import { makeAutoObservable, runInAction } from "mobx";

export class Project {
  rootDirHandle: FileSystemDirectoryHandle | null = null;
  scenes: Scene[] = [];

  constructor(rootDirHandle: FileSystemDirectoryHandle | null = null) {
    this.rootDirHandle = rootDirHandle;
    makeAutoObservable(this);
  }

  async loadScenes() {
    if (!this.rootDirHandle) return;

    try {
      const scenesFolder = await this.rootDirHandle.getDirectoryHandle("SCENES");

      const loadedScenes: Scene[] = [];
      for await (const entry of scenesFolder.values()) {
        if (entry.kind === "directory") {
          const scene = new Scene(entry);
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

  setRootDirHandle(handle: FileSystemDirectoryHandle) {
    this.rootDirHandle = handle;
  }
}
