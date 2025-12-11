// Shot.ts
import { Scene } from './Scene';
import { LocalJson } from './LocalJson';
import { LocalImage } from './LocalImage';
import { makeAutoObservable, runInAction } from "mobx";

export class Shot {
  folder: FileSystemDirectoryHandle;
  scene: Scene;
  shotJson: LocalJson | null = null;
  images: LocalImage[] = [];
  srcImage: LocalImage | null = null;
  resultsFolder: FileSystemDirectoryHandle | null = null; // <--- store results folder

  constructor(folder: FileSystemDirectoryHandle, scene: Scene) {
    this.folder = folder;
    this.scene = scene;
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    try {
      this.shotJson = await LocalJson.create(this.folder, 'shotinfo.json');

      this.images = [];
      this.srcImage = null;

      // Try to get or create results folder
      try {
        this.resultsFolder = await this.folder.getDirectoryHandle('results', { create: true });

        for await (const [name, handle] of this.resultsFolder.entries()) {
          if (handle.kind === 'file') {
            const localImage = new LocalImage(handle);
            this.images.push(localImage);

            if (this.shotJson.data?.srcImage && name === this.shotJson.data.srcImage) {
              this.srcImage = localImage;
            }
          }
        }
      } catch (err) {
        console.warn('No results folder found or failed to read:', err);
        this.resultsFolder = null;
      }
    } catch (err) {
      console.error('Error loading shot:', this.folder.name, err);
      this.shotJson = null;
      this.images = [];
      this.srcImage = null;
      this.resultsFolder = null;
    }
  }

  setSrcImage(image: LocalImage | null) {
    this.srcImage = image;

    if (this.shotJson?.data) {
      this.shotJson.data.srcImage = image?.handle.name;
      this.shotJson.save();
    }
  }

  async delete(): Promise<void> {
    if (!this.scene?.folder) {
      console.error("Cannot delete shot: scene folder not set");
      return;
    }

    try {
      await this.scene.folder.removeEntry(this.folder.name, { recursive: true });

      runInAction(() => {
        this.scene.shots = this.scene.shots.filter(s => s !== this);
      });
    } catch (err) {
      console.error("Failed to delete shot:", err);
    }
  }

  addImage(image: LocalImage) {
    this.images.push(image);
  }

  removeImage(image: LocalImage) {
    // Remove from array
    this.images = this.images.filter(i => i !== image);

    // If it was the source image, clear it
    if (this.srcImage === image) {
      this.setSrcImage(null);
    }
  }
}
