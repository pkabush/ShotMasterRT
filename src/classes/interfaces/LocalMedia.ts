import type { MediaFolder } from "../MediaFolder";
import type { Shot } from "../Shot";
import * as webFileStorage from './../webFileStorage';
import { runInAction, toJS, makeObservable, observable, action } from "mobx";

// LocalMediaInterface.ts
export class LocalMedia {
  handle: FileSystemFileHandle;
  parent: FileSystemDirectoryHandle;
  path: string;
  shot: Shot | null;
  urlObject: string | null = null;
  web_url: string = "";
  tags: string[] = [];
  mediaFolder: MediaFolder | null = null;
  onTagChanged?: (media: LocalMedia, tag: string, added: boolean) => void;

  constructor(handle: FileSystemFileHandle, parent: FileSystemDirectoryHandle, parent_path: string = "", shot: Shot | null = null) {
    this.handle = handle;
    this.parent = parent;
    this.path = parent_path + "/" + handle.name;
    this.shot = shot;

    makeObservable(this, {
      urlObject: observable,
      web_url: observable,

      revokeUrl: action,
      delete: action,
      getUrlObject: action,
      //Tags
      tags: observable,
      addTag: action,
      removeTag: action,
      setTags: action,
    });
  }

  get name():string{
      return this.handle.name;
  }

  // Delete from folder
  async delete(): Promise<void> {
    try {
      this.revokeUrl();
      await this.parent.removeEntry(this.handle.name);
    } catch (err) {
      console.error('Failed to delete video file:', err);
      throw err;
    }
  }

  // Cleanup object URL
  revokeUrl(): void {
    if (this.urlObject) {
      URL.revokeObjectURL(this.urlObject);
      this.urlObject = null;
    }
  }

  async getWebUrl() {
    const nextUrl = await webFileStorage.ensureUploaded(await this.handle.getFile(), this.web_url);
    runInAction(() => { this.web_url = nextUrl; });
    return this.web_url;
  }

  async getUrlObject(): Promise<string> {
    if (!this.urlObject) {
      try {
        const file = await this.handle.getFile();
        const objectUrl = URL.createObjectURL(file);
        runInAction(() => { this.urlObject = objectUrl; });
      } catch (err) {
        console.error("Failed to create object URL:", err);
        runInAction(() => { this.urlObject = ""; });
      }
    }
    return this.urlObject!;
  }
  // Create a LocalVideo from a URL
  static async fromUrl(url: string, folder: FileSystemDirectoryHandle): Promise<LocalMedia> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

      const blob = await response.blob();

      // Extract filename from URL (remove query params)
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1].split("?")[0];

      // Create file handle and write blob
      const fileHandle = await folder.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      return new LocalMedia(fileHandle, folder);
    } catch (err) {
      console.error('Failed to create LocalVideo from URL:', err);
      throw err;
    }
  }

  log() {
    console.log(toJS(this));
  }

  addTag(tag: string) {
    if (!tag) return;
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.onTagChanged?.(this, tag, true);
    }
  }

  removeTag(tag: string) {
    if (this.tags.includes(tag)) {
      this.tags = this.tags.filter(t => t !== tag);
      this.onTagChanged?.(this, tag, false);
    }
  }
  setTags(tags: string[]) {
    if(!tags) return;
    this.tags = Array.from(new Set(tags.filter(Boolean)));
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  toggleTag(tag: string) {
    if (!tag) return;
    if (this.hasTag(tag)) { this.removeTag(tag); }
    else { this.addTag(tag); }
  }
}
