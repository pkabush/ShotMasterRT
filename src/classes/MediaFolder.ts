// MediaFolder.ts
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { LocalImage } from './LocalImage';
import { LocalVideo } from './LocalVideo';
import type { LocalMedia } from "./interfaces/LocalMedia";
import type { LocalJson } from "./LocalJson";
import type { Shot } from "./Shot";
import { LocalAudio } from "./LocalAudio";

export class MediaFolder {
    parentFolder: FileSystemDirectoryHandle;
    folderName: string;
    folder: FileSystemDirectoryHandle | null = null;
    media: LocalMedia[] = []; // unified array
    path: string = "";
    pickedMedia: LocalMedia | null = null;
    selectedMedia: LocalMedia | null = null;
    // Named Media Array
    tags: string[] = ["picked", "start_frame", "end_frame", "motion_ref"];
    multi_tags: string[] = ["ref_frame"];
    storage_json: LocalJson | null = null;
    shot: Shot | null = null;

    // Callbacks
    onPicked?: (media: LocalMedia | null) => void;
    onSelected?: (media: LocalMedia | null) => void;


    constructor(parentFolder: FileSystemDirectoryHandle, folderName: string, basePath: string = "", storage_json: LocalJson | null = null, shot: Shot | null = null) {
        this.parentFolder = parentFolder;
        this.folderName = folderName;
        this.path = basePath ? `${basePath}/${folderName}` : folderName;
        this.storage_json = storage_json;
        this.shot = shot;
        makeAutoObservable(this);
    }

    async load(): Promise<void> {
        try {
            // Get or create the folder inside parent
            this.folder = await this.parentFolder.getDirectoryHandle(this.folderName, { create: true });

            for await (const [, handle] of this.folder.entries()) {
                if (handle.kind === "file") { this.loadFile(handle as FileSystemFileHandle); }
            }
            /*
            if (this.storage_json) {
                this.setNamedMediaJson(this.storage_json.getField("MediaFolder_" + this.folderName));
            }*/

        } catch (err) {
            console.error(`Failed to load MediaFolder '${this.folderName}':`, err);
            runInAction(() => {
                this.folder = null;
                this.media = [];
            });
        }
    }

    async deleteMedia(mediaItem: LocalMedia, showConfirm: boolean = true): Promise<void> {
        if (!this.folder) throw new Error("Folder not loaded");
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
        if (!this.folder) { throw new Error("MediaFolder not loaded"); }

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
            const fileHandle = await this.folder.getFileHandle(filename, { create: true });
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
    loadFile(fileHandle: FileSystemFileHandle): LocalMedia | null {
        const name = fileHandle.name;

        let mediaItem: LocalMedia | null = null;

        if (name.match(/\.(png|jpe?g|gif|webp)$/i)) {
            mediaItem = new LocalImage(fileHandle, this.folder!, this.path, this.shot);
        } else if (name.match(/\.(mp4|mov|webm|avi)$/i)) {
            mediaItem = new LocalVideo(fileHandle, this.folder!, this.path, this.shot);
        } else if (name.match(/\.(mp3|wav|m4a)$/i)) {
            mediaItem = new LocalAudio(fileHandle, this.folder!, this.path, this.shot);
        }



        if (!mediaItem) return null;

        // Set Tags from JSON
        mediaItem.setTags(toJS(this.storage_json?.getField("MF_" + this.folderName + "/" + mediaItem.name)));

        // Set callback so unique tags are removed from other media
        //@ts-ignore
        mediaItem.onTagChanged = (currentMedia, tag, added) => {
            if (added && !this.multi_tags.includes(tag)) {
                for (const otherMedia of this.media) {
                    if (otherMedia !== currentMedia && otherMedia.hasTag(tag)) {
                        otherMedia.removeTag(tag);
                    }
                }
            }

            if (this.storage_json) { this.storage_json.updateField("MF_" + this.folderName, this.mediaJson); }
        };

        runInAction(() => { this.media.push(mediaItem); });

        return mediaItem;
    }
    async saveFiles(files: File[]) {
        if (!this.folder) { throw new Error("MediaFolder not loaded"); }

        for (const file of files) {
            try {
                // Create / overwrite file
                const fileHandle = await this.folder.getFileHandle(file.name, { create: true, });
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
        if (!this.folder) { throw new Error("MediaFolder not loaded"); }
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

    //-------------------
    // Tag Functions 
    // ------------------
    get mediaJson(): any {
        const result: any = {};
        for (const media of this.media) {
            if (media.tags.length > 0) result[media.name] = toJS(media.tags);
        }
        return toJS(result);
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
