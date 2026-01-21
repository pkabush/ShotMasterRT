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

            const loadedMedia: LocalMedia[] = [];

            for await (const [name, handle] of this.folder.entries()) {
                if (handle.kind === "file") {
                    const fileHandle = handle as FileSystemFileHandle;

                    if (name.match(/\.(png|jpe?g|gif|webp)$/i)) {
                        loadedMedia.push(new LocalImage(fileHandle, this.folder, this.path));
                    } else if (name.match(/\.(mp4|mov|webm|avi)$/i)) {
                        loadedMedia.push(new LocalVideo(fileHandle, this.folder, this.path));
                    }
                }
            }

            runInAction(() => {
                this.media = loadedMedia;
            });
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
            });
        } catch (err) {
            console.error("Failed to delete media:", err);
            alert(`Failed to delete ${mediaItem instanceof LocalImage ? "image" : "video"}.`);
        }
    }

    setSelectedMedia(media: LocalMedia | null) {
        runInAction(() => {
            this.selectedMedia = media;
        });
    }

    setPickedMedia(media: LocalMedia | null) {
        runInAction(() => {
            this.pickedMedia = media;
        });
    }
    log() { console.log(toJS(this)); }

    pickByFilename(filename: string | null | undefined) {
        if (!filename) return; // exit if null or empty
        const mediaItem = this.media.find(m => m.path.endsWith(filename));
        if (mediaItem) {
            this.setPickedMedia(mediaItem);
        } else {
            console.warn(`Media with filename '${filename}' not found.`);
        }
    }

}
