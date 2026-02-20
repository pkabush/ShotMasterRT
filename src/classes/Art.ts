// Art.ts
import { LocalImage } from "./LocalImage";
import { LocalJson } from "./LocalJson";
import { makeAutoObservable, runInAction } from "mobx";
import { Artbook } from "./Artbook";
import type { LocalFolder } from "./LocalFile";

export class Art {
  handle: FileSystemFileHandle;
  folder: FileSystemDirectoryHandle; // parent folder
  image: LocalImage;
  artInfo: LocalJson | null = null; // observable
  path: string; // new: TYPE/ITEM/FILENAME
  artbook: Artbook | null; // pointer to parent Artbook


  constructor(
    handle: FileSystemFileHandle,
    folder: LocalFolder,
    path: string,
    artbook: Artbook | null = null
  ) {
    this.handle = handle;
    this.folder = folder.handle;
    this.image = new LocalImage(handle,folder);
    this.path = path;
    this.artbook = artbook;
    makeAutoObservable(this); // make artInfo observable
  }

  async getArtInfo() {
    if (this.artInfo) return this.artInfo;

    try {
      const info = await LocalJson.create(this.folder, this.handle.name + ".json");
      runInAction(() => {
        this.artInfo = info;
      });
    } catch (err) {
      console.warn("Unable to load art info for:", this.handle.name, err);
    }

    return this.artInfo;
  }
}
