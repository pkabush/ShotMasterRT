import { LocalFile, LocalFolder } from "./LocalFile";
import type { LocalImage } from "./LocalImage";
import { LocalJson } from "../LocalJson";
import type { MediaFolder } from "../MediaFolder";
import type { Shot } from "../Shot";
import * as webFileStorage from '../webFileStorage';
import { runInAction, toJS, makeObservable, observable, action, computed } from "mobx";

// LocalMediaInterface.ts
export class LocalMedia extends LocalFile {
  shot: Shot | null;
  urlObject: string | null = null;
  web_url: string = "";
  mediaFolder: MediaFolder | null = null;
  mediaJson: LocalJson | null = null;
  onTagChanged?: (media: LocalMedia, tag: string, added: boolean) => void;
  file: File | null = null;

  constructor(handle: FileSystemFileHandle, parentFolder: LocalFolder) {
    super(parentFolder, handle)
    this.handle = handle;

    this.shot = parentFolder.parentFolder as Shot;

    makeObservable(this, {
      urlObject: observable,
      web_url: observable,

      revokeUrl: action,
      delete: action,
      getUrlObject: action,
      //Tags
      tags: computed,
      addTag: action,
      removeTag: action,
      setTags: action,
    });
  }

  async load(): Promise<void> {
    this.mediaJson = await LocalJson.create(this.parentFolder!.handle, this.name + '.json');
  }

  get name(): string {
    return this.handle.name;
  }

  // Delete from folder
  async delete(): Promise<void> {
    try {
      this.revokeUrl();
      await this.parentFolder?.handle.removeEntry(this.handle.name);
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
    const nextUrl = await webFileStorage.ensureUploaded(await this.getFile(), this.web_url);
    runInAction(() => { this.web_url = nextUrl; });
    return this.web_url;
  }

  async getUrlObject(): Promise<string> {
    if (!this.urlObject) {
      try {
        const file = await this.getFile();
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
  static async fromUrl(url: string, folder: LocalFolder): Promise<LocalMedia> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

      const blob = await response.blob();

      // Extract filename from URL (remove query params)
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1].split("?")[0];

      // Create file handle and write blob
      const fileHandle = await folder.handle.getFileHandle(filename, { create: true });
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

  get tags(): string[] {
    if (!this.mediaJson) return [];
    const tags = this.mediaJson.getField("tags");
    return Array.isArray(tags) ? tags : [];
  }

  async setTags(tags: string[]) {
    if (!this.mediaJson) return;
    const cleaned = Array.from(new Set(tags.filter(Boolean)));
    await this.mediaJson.updateField("tags", cleaned.length ? cleaned : undefined);
  }

  async addTag(tag: string) {
    if (!tag) return;
    const current = this.tags;
    if (current.includes(tag)) return;
    await this.setTags([...current, tag]);
    this.onTagChanged?.(this, tag, true);
  }

  async removeTag(tag: string) {
    const current = this.tags;
    if (!current.includes(tag)) return;
    await this.setTags(current.filter(t => t !== tag));
    this.onTagChanged?.(this, tag, false);
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  toggleTag(tag: string) {
    if (!tag) return;
    if (this.hasTag(tag)) { this.removeTag(tag); }
    else { this.addTag(tag); }
  }

  async openInNewTab() {
    try {
      const url = await this.getUrlObject();

      const tabName = this.path.replace(/[\/\\]/g, "_");
      window.open(url, tabName, "noopener,noreferrer");

    } catch (err) {
      console.error("Failed to open media in new tab:", err);
    }
  }




  // Gen Info
  get genInfo(): any | null {
    if (!this.mediaJson) return null;
    return this.mediaJson.getField("geninfo");
  }

  get sourceImage(): LocalImage | null {
    if (!this.mediaJson) return null;
    const source_path = this.genInfo?.source;
    if (!source_path) return null;
    return this.getByAbsPath(source_path) as LocalImage;
  }

  get generatedMedia(): LocalMedia[] {
    const generated_images: LocalMedia[] = [];

    for (const media of this.mediaFolder!.media) {
      if (media.genInfo && media.genInfo.source) {
        if (media.genInfo.source == this.path) generated_images.push(media);
      }

    }

    return generated_images;
  }

}
