import { LocalJson } from './LocalJson';

export class Scene {
  folder: FileSystemDirectoryHandle;
  sceneJson: LocalJson | null = null;
  shots: FileSystemDirectoryHandle[] = [];

  constructor(folder: FileSystemDirectoryHandle) {
    this.folder = folder;
  }

  // Load sceneinfo.json and shots
  async load(): Promise<void> {
    try {
      // Load sceneinfo.json
      this.sceneJson = await LocalJson.create(this.folder, 'sceneinfo.json');

      // Load subfolders (shots)
      this.shots = [];
      for await (const [name, handle] of this.folder.entries()) {
        if (handle.kind === 'directory') {
          this.shots.push(handle);
        }
      }
    } catch (err) {
      console.error('Error loading scene:', err);
      this.sceneJson = null;
      this.shots = [];
    }
  }
}
