// Shot.ts
import { Scene } from './Scene';
import { LocalJson } from './LocalJson';
import { LocalImage } from './LocalImage';
import { makeAutoObservable } from "mobx";

export class Shot {
  folder: FileSystemDirectoryHandle;
  scene: Scene;
  shotJson: LocalJson | null = null;
  images: LocalImage[] = []; // array of LocalImage
  srcImage: LocalImage | null = null;

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

      try {
        const resultsFolder = await this.folder.getDirectoryHandle('results', { create: false });

        for await (const [name, handle] of resultsFolder.entries()) {
          if (handle.kind === 'file') {
            const localImage = new LocalImage(handle);
            this.images.push(localImage);

            if (this.shotJson.data?.srcImage && name === this.shotJson.data.srcImage) {
              this.srcImage = localImage;
            }
          }
        }
      } catch {
        this.images = [];
      }
    } catch (err) {
      console.error('Error loading shot:', this.folder.name, err);
      this.shotJson = null;
      this.images = [];
      this.srcImage = null;
    }
  }
  
  /** MobX action to safely set srcImage */
  setSrcImage(image: LocalImage | null) {
    this.srcImage = image;

    // Update And save Json Data
    if (this.shotJson?.data) {
      this.shotJson.data.srcImage = image?.handle.name;
      this.shotJson.save();
    }
  }
}
