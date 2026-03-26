import { LocalFile } from "./LocalFile";
import type { LocalImage } from "./LocalImage";
import { LocalJson } from "../LocalJson";
import type { MediaFolder } from "../MediaFolder";
import type { Shot } from "../Shot";
import * as webFileStorage from '../webFileStorage';
import { runInAction, makeObservable, observable, action, computed, override } from "mobx";
import type { LocalFolder } from "./LocalFolder";
import { Tags } from "../Tags";

// LocalMediaInterface.ts
export class LocalMedia extends LocalFile {
  urlObject: string | null = null;
  web_url: string = "";
  mediaJson: LocalJson | null = null;
  file: File | null = null;
  references: Tags | null = null;

  // internal promise
  private _urlPromise: Promise<string> | null = null;

  get mediaFolder(): MediaFolder {
    return this.parentFolder as MediaFolder;
  }

  get shot(): Shot | null {
    return this.parentFolder?.parentFolder as Shot;
  }

  constructor(parentFolder: LocalFolder, handle: FileSystemFileHandle) {
    super(parentFolder, handle)
    this.handle = handle;

    makeObservable(this, {
      urlObject: observable,
      web_url: observable,
      mediaJson:observable,

      revokeUrl: action,
      delete: override,
      getUrlObject: action,
      //Tags
      tags: computed,
      addTag: action,
      removeTag: action,
      setTags: action,
    });

    this._urlPromise = null; // initialize
  }

  async load(): Promise<void> {
    this.mediaJson = await LocalJson.create(this.parentFolder!.handle, this.name + '.json');
    this.references = new Tags(this,this.mediaJson);
  }

  get name(): string {
    return this.handle.name;
  }

  // Delete from folder
  async delete(): Promise<void> {
    try {
      this.revokeUrl();
      if (this.mediaJson) { await this.mediaJson.updateField("", undefined); }
      await super.delete();
    } catch (err) {
      console.error('Failed to delete media file:', err);
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
    if (this.urlObject) return this.urlObject; // already loaded
    if (this._urlPromise) return this._urlPromise; // already loading

    // store promise so concurrent calls reuse it
    this._urlPromise = (async () => {
      try {
        const file = await this.getFile();
        // Revoke old URL if any
        if (this.urlObject) URL.revokeObjectURL(this.urlObject);
        const objectUrl = URL.createObjectURL(file);
        runInAction(() => { this.urlObject = objectUrl; });
      } catch (err) {
        console.error("Failed to create object URL:", err);
        runInAction(() => { this.urlObject = ""; });
      } finally {
        // clear the promise so next call can retry if needed
        this._urlPromise = null;
      }
      return this.urlObject!;
    })();
    return this._urlPromise;
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
    this.onTagChanged(tag, true);
  }

  async removeTag(tag: string) {
    const current = this.tags;
    if (!current.includes(tag)) return;
    await this.setTags(current.filter(t => t !== tag));
    this.onTagChanged(tag, false);
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

  onTagChanged(tag: string, added: boolean) {
    if (added && !this.mediaFolder.multi_tags.includes(tag)) {
      for (const otherMedia of this.mediaFolder.media) {
        if (otherMedia !== this && otherMedia.hasTag(tag)) {
          otherMedia.removeTag(tag);
        }
      }
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
