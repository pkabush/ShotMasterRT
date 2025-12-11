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
      this.sceneJson = await LocalJson.create(this.folder, 'sceneinfo.json', {tags:[],test:"BABAB"});

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

  async delete(): Promise<void> {
    if (!this.project?.rootDirHandle) {
      console.error("Cannot delete scene: project root not set");
      return;
    }

    try {
      const scenesFolder = await this.project.rootDirHandle.getDirectoryHandle("SCENES");
      await scenesFolder.removeEntry(this.folder.name, { recursive: true });

      runInAction(() => {
        if (this.project) {
          this.project.scenes = this.project.scenes.filter(s => s !== this);
        }
      });

    } catch (err) {
      console.error("Failed to delete scene:", err);
    }
  }

  // create Shot
  async createShot(shotName: string): Promise<Shot | null> {
    if (!this.folder) {
      console.error("No scene folder available");
      return null;
    }

    try {
      const shotFolder = await this.folder.getDirectoryHandle(shotName, { create: true });
      const shot = new Shot(shotFolder, this);
      await shot.load();

      // Insert shot alphabetically by folder name
      runInAction(() => {
        const index = this.shots.findIndex(s => s.folder.name.localeCompare(shotName) > 0);
        if (index === -1) this.shots.push(shot);
        else this.shots.splice(index, 0, shot);
      });

      return shot;
    } catch (err) {
      console.error("Failed to create shot:", err);
      return null;
    }
  }

  get finishedShotsNum(): number {
    return this.shots.filter(shot => shot.shotJson?.data?.finished).length;
  }

}
