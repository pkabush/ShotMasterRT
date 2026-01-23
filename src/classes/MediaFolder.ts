// MediaFolder.ts
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { LocalImage } from './LocalImage';
import { LocalVideo } from './LocalVideo';
import type { LocalMedia } from "./interfaces/LocalMedia";

export class MediaFolder {
    parentFolder: FileSystemDirectoryHandle;
    folderName: string;
    folder: FileSystemDirectoryHandle | null = null;
    media: LocalMedia[] = []; // unified array
    path: string = "";
    pickedMedia: LocalMedia | null = null;
    selectedMedia: LocalMedia | null = null;
    // Named Media Array
    named_media: Record<string, LocalMedia> = {};

    // Callbacks
    onPicked?: (media: LocalMedia | null) => void;
    onSelected?: (media: LocalMedia | null) => void;
    onNamedMediaUpdate?: (name: string, media: LocalMedia | null) => void;



    constructor(parentFolder: FileSystemDirectoryHandle, folderName: string, basePath: string = "") {
        this.parentFolder = parentFolder;
        this.folderName = folderName;
        this.path = basePath ? `${basePath}/${folderName}` : folderName;
        makeAutoObservable(this);
    }

    async load(createIfMissing: boolean = true): Promise<void> {
        try {
            // Get or create the folder inside parent
            this.folder = await this.parentFolder.getDirectoryHandle(this.folderName, { create: createIfMissing });

            for await (const [, handle] of this.folder.entries()) {
                if (handle.kind === "file") {
                    this.loadFile(handle as FileSystemFileHandle);
                }
            }


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
            runInAction(() => {
                this.media = this.media.filter(i => i !== mediaItem);

                // remove from named_media if referenced
                for (const key of Object.keys(this.named_media)) {
                    if (this.named_media[key] === mediaItem) {
                        delete this.named_media[key];
                    }
                }
            });
        } catch (err) {
            console.error("Failed to delete media:", err);
            alert(`Failed to delete ${mediaItem instanceof LocalImage ? "image" : "video"}.`);
        }
    }


    setSelectedMedia(media: LocalMedia | null) {
        if (this.selectedMedia === media) return;
        runInAction(() => {
            this.selectedMedia = media;
        });
        this.onSelected?.(media);
    }

    setPickedMedia(media: LocalMedia | null) {
        if (this.pickedMedia === media) return;
        runInAction(() => {
            this.pickedMedia = media;
            this.setNamedMedia("picked", media);
        });
        this.onPicked?.(media);
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
            mediaItem = new LocalImage(fileHandle, this.folder!, this.path);
        } else if (name.match(/\.(mp4|mov|webm|avi)$/i)) {
            mediaItem = new LocalVideo(fileHandle, this.folder!, this.path);
        }

        if (!mediaItem) return null;

        runInAction(() => {
            this.media.push(mediaItem);
        });

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

    // Named Media Acess
    setNamedMedia(name: string, media: LocalMedia | null) {
        runInAction(() => {
            if (media === null) {
                delete this.named_media[name];
            } else {
                this.named_media[name] = media;
            }
            this.onNamedMediaUpdate?.(name, media);
        });
    }
    getNamedMedia(name: string): LocalMedia | null {
        return this.named_media[name] ?? null;
    }
    getMediaTags(media: LocalMedia): string[] {
        return Object.entries(this.named_media)
            .filter(([, value]) => value === media)
            .map(([key]) => key);
    }
    getMediaByFilename(filename: string): LocalMedia | null {
        return this.media.find(m => m.path.endsWith(filename)) ?? null;
    }

    get namedMediaJson(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [name, media] of Object.entries(this.named_media)) {
            result[name] = media.handle.name;
        }
        return result;
    }

    setNamedMediaJson(value: any) {        
        runInAction(() => {
            this.named_media = {};

            if (value == null) return;

            for (const [name, filename] of Object.entries(value)) {
                const media = this.media.find(m => m.handle.name === filename);
                if (media) {
                    this.named_media[name] = media;
                } else {
                    console.warn(`namedMediaJson: media file '${filename}' not found for tag '${name}'`);
                }
            }
        });
    }



}
