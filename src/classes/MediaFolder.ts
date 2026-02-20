// MediaFolder.ts
import { action, makeObservable, observable, runInAction, toJS } from "mobx";
import { LocalImage } from './LocalImage';
import { LocalVideo } from './LocalVideo';
import type { LocalMedia } from "./interfaces/LocalMedia";
import type { Shot } from "./Shot";
import { LocalAudio } from "./LocalAudio";
import { LocalFolder } from "./LocalFile";

export class MediaFolder extends LocalFolder {
    media: LocalMedia[] = []; // unified array
    pickedMedia: LocalMedia | null = null;
    selectedMedia: LocalMedia | null = null;
    // Named Media Array
    tags: string[] = ["picked", "start_frame", "end_frame", "motion_ref"];
    multi_tags: string[] = ["ref_frame"];
    shot: Shot | null = null;

    // Callbacks
    onPicked?: (media: LocalMedia | null) => void;
    onSelected?: (media: LocalMedia | null) => void;

    static async create(
        parentFolder: LocalFolder,
        name: string
    ): Promise<MediaFolder> {
        const handle = await parentFolder.handle.getDirectoryHandle(name, { create: true });
        const mediaFodler = new MediaFolder(parentFolder, handle);
        await mediaFodler.load();
        return mediaFodler;
    }

    constructor(parentFolder: LocalFolder, handle: FileSystemDirectoryHandle) {
        super(parentFolder, handle)

        this.shot = parentFolder as Shot;
        makeObservable(this, {
            // observables
            media: observable,
            pickedMedia: observable,
            selectedMedia: observable,
            tags: observable,
            multi_tags: observable,
            shot: observable,

            // actions
            load: action,
            deleteMedia: action,
            setSelectedMedia: action,
            downloadFromUrl: action,
            loadFile: action,
            saveFiles: action,
            copyFromClipboard: action,
        });
    }

    async load(): Promise<void> {
        try {
            for await (const [, handle] of this.handle.entries()) {
                if (handle.kind === "file") { await this.loadFile(handle as FileSystemFileHandle); }
            }

        } catch (err) {
            console.error(`Failed to load MediaFolder '${this.name}':`, err);
            runInAction(() => {
                this.media = [];
            });
        }
    }

    async deleteMedia(mediaItem: LocalMedia, showConfirm: boolean = true): Promise<void> {
        if (!this.handle) throw new Error("Folder not loaded");
        if (showConfirm && !window.confirm(`Delete this ${mediaItem instanceof LocalImage ? "image" : "video"}?`)) { return; }

        try {
            await mediaItem.delete();
            runInAction(() => { this.media = this.media.filter(i => i !== mediaItem); });
        } catch (err) {
            console.error("Failed to delete media:", err);
            alert(`Failed to delete ${mediaItem instanceof LocalImage ? "image" : "video"}.`);
        }
    }

    setSelectedMedia(media: LocalMedia | null) {
        runInAction(() => {
            if (this.selectedMedia === media)
                this.selectedMedia = null;
            else
                this.selectedMedia = media;
        });
        this.onSelected?.(media);
    }

    log() { console.log(toJS(this)); }

    async downloadFromUrl(url: string): Promise<LocalMedia | null> {
        if (!this.handle) { throw new Error("MediaFolder not loaded"); }

        try {
            const response = await fetch(url);
            if (!response.ok) { throw new Error(`Failed to fetch: ${response.statusText}`); }

            const blob = await response.blob();

            // Extract filename from URL
            const urlObj = new URL(url);
            let filename = urlObj.pathname.split("/").pop() || "download";

            // Fallback extension from MIME type if missing
            if (!filename.includes(".")) {
                const ext = blob.type.split("/")[1];
                if (ext) filename += `.${ext}`;
            }

            // Create file in folder
            const fileHandle = await this.handle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            const newMedia = this.loadFile(fileHandle);

            return newMedia;
        } catch (err) {
            console.error("Failed to download media from URL:", err);
            throw err;
        }
    }

    async loadFile(fileHandle: FileSystemFileHandle): Promise<LocalMedia | null> {
        const name = fileHandle.name;

        let mediaItem: LocalMedia | null = null;

        if (name.match(/\.(png|jpe?g|gif|webp)$/i)) {
            mediaItem = new LocalImage(fileHandle, this);
        } else if (name.match(/\.(mp4|mov|webm|avi)$/i)) {
            mediaItem = new LocalVideo(fileHandle, this);
        } else if (name.match(/\.(mp3|wav|m4a)$/i)) {
            mediaItem = new LocalAudio(fileHandle, this);
        }

        return await this.addMediaItem(mediaItem);
    }

    async addMediaItem(mediaItem : LocalMedia | null) : Promise<LocalMedia | null>{
        if (!mediaItem) return null;

        await mediaItem.load();
        mediaItem.mediaFolder = this;

        // Update tags for Single Select Tags
        mediaItem.onTagChanged = (currentMedia, tag, added) => {
            if (added && !this.multi_tags.includes(tag)) {
                for (const otherMedia of this.media) {
                    if (otherMedia !== currentMedia && otherMedia.hasTag(tag)) {
                        otherMedia.removeTag(tag);
                    }
                }
            }
        }

        runInAction(() => { this.media.push(mediaItem); });
        return mediaItem;
    }


    async saveFiles(files: File[]) {
        if (!this.handle) { throw new Error("MediaFolder not loaded"); }

        for (const file of files) {
            try {
                // Create / overwrite file
                const fileHandle = await this.handle.getFileHandle(file.name, { create: true, });
                const writable = await fileHandle.createWritable();
                await writable.write(file);
                await writable.close();
                // Load + register media
                this.loadFile(fileHandle);
            } catch (err) {
                console.error(`Failed to save file '${file.name}':`, err);
            }
        }
    }

    async copyFromClipboard() {
        if (!this.handle) { throw new Error("MediaFolder not loaded"); }
        if (!navigator.clipboard || !navigator.clipboard.read) { console.warn("Clipboard API not supported"); return; }

        const files: File[] = [];

        try {
            const items = await navigator.clipboard.read();
            console.log(items);

            for (const item of items) {
                for (const type of item.types) {
                    if (!type.startsWith("image/") && !type.startsWith("video/")) { continue; }

                    const blob = await item.getType(type);

                    // Preserve original filename if present
                    const filename = (blob as File).name || `clipboard-${Date.now()}.${type.split("/")[1]}`;
                    files.push(blob instanceof File ? blob : new File([blob], filename, { type }));
                }
            }

            if (files.length === 0) { console.info("Clipboard does not contain files"); return; }
            await this.saveFiles(files);
        } catch (err) {
            console.error("Failed to read from clipboard:", err);
            return;
        }
    }

    getMediaWithTag(tag: string): LocalMedia[] {
        if (!tag) return [];
        return this.media.filter(media => media.hasTag(tag));
    }

    getFirstMediaWithTag(tag: string): LocalMedia | null {
        return this.media.find(media => media.hasTag(tag)) ?? null;
    }

    hasAnyMediaWithTag(tag: string): boolean {
        return this.media.some(media => media.hasTag(tag));
    }

    getMediaByFilename(filename: string): LocalMedia | null {
        if (!filename) return null;
        return this.media.find(m => m.name === filename) ?? null;
    }

}
