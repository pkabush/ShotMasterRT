// Scene.ts
import { LocalJson } from './LocalJson';
import { Shot } from './Shot';
import { makeAutoObservable } from "mobx";

export class Scene {
  folder: FileSystemDirectoryHandle;
  sceneJson: LocalJson | null = null;
  shots: Shot[] = [];

  constructor(folder: FileSystemDirectoryHandle) {
    this.folder = folder;
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    try {
      this.sceneJson = await LocalJson.create(this.folder, 'sceneinfo.json');

      this.shots = [];
      for await (const [name, handle] of this.folder.entries()) {
        if (handle.kind === 'directory') {
          const shot = new Shot(handle, this);
          await shot.load(); // load shotinfo.json
          this.shots.push(shot);
        }
      }
    } catch (err) {
      console.error('Error loading scene:', err);
      this.sceneJson = null;
      this.shots = [];
    }
  }
}
