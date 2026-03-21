// MediaFolder.ts
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { LocalMedia } from "./fileSystem/LocalMedia";
import type { Shot } from "./Shot";
import { LocalFolder } from "./fileSystem/LocalFolder";

export class MediaFolder extends LocalFolder {
    selectedMedia: LocalMedia | null = null;
    // Named Media Array
    tags: string[] = ["picked", "start_frame", "end_frame", "motion_ref"];
    multi_tags: string[] = ["ref_frame", "picked_extra"];

    static async create(
        parentFolder: LocalFolder,
        name: string
    ): Promise<MediaFolder> {
        const handle = await parentFolder.handle.getDirectoryHandle(name, { create: true });
        const mediaFodler = new MediaFolder(parentFolder, handle);
        await mediaFodler.load_files();
        return mediaFodler;
    }

    get shot(): Shot {
        return this.parentFolder as Shot;
    }

    get media(): LocalMedia[] {
        return this.getType(LocalMedia)
    }

    get mediaOrdered(): LocalMedia[] {
        return [...this.media].sort(
            (a, b) => a.lastModified - b.lastModified
        );
    }

    constructor(parentFolder: LocalFolder | null, handle: FileSystemDirectoryHandle) {
        super(parentFolder, handle)

        makeObservable(this, {
            // observables
            selectedMedia: observable,
            tags: observable,
            multi_tags: observable,
            // actions
            setSelectedMedia: action,
            // computed
            mediaOrdered: computed,
            shot: computed,
            media: computed,
        });
    }

    setSelectedMedia(media: LocalMedia | null) {
        runInAction(() => {
            if (this.selectedMedia === media)
                this.selectedMedia = null;
            else
                this.selectedMedia = media;
        });
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
