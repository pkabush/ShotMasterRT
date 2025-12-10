// Scene.ts
import { LocalJson } from './LocalJson';
import { Shot } from './Shot';
import { makeAutoObservable, runInAction } from "mobx";
import { Project } from './Project';

export class Scene {
  folder: FileSystemDirectoryHandle;
  sceneJson: LocalJson | null = null;
  shots: Shot[] = [];
  project: Project | null = null; // <--- new pointer to parent project

 constructor(folder: FileSystemDirectoryHandle, project: Project | null = null) {
    this.folder = folder;
    this.project = project; // assign parent project
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

  removeTag(path: string) {
    if (!this.sceneJson?.data?.tags) return;

    // Directly mutate the observable array
    this.sceneJson.data.tags = this.sceneJson.data.tags.filter(
      (tag: string) => tag !== path
    );

    this.sceneJson.save();
  }

}
