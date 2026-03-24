import { makeObservable, observable, runInAction, toJS } from "mobx";
import type { LocalFolder } from "./LocalFolder";

// LocalItem.ts
export abstract class LocalItem {
    path: string = "";
    parentFolder: LocalFolder | null;
    handle: FileSystemHandle;

    children: LocalItem[] = [];

    constructor(parentFolder: LocalFolder | null = null, handle: FileSystemHandle) {
        this.parentFolder = parentFolder;
        this.path = (parentFolder?.path || "") + "/" + (handle?.name || "");
        this.handle = handle;

        makeObservable(this, {
            children: observable, // <-- add this
        });

        if (this.parentFolder) {
            runInAction(() => {
                const siblings = this.parentFolder!.children;

                // Check if already exists
                const existingIndex = siblings.findIndex(child => child.path === this.path);
                if (existingIndex !== -1) {
                    siblings[existingIndex] = this;
                    return;
                }

                // Find correct insertion index (sorted by path)
                const insertIndex = siblings.findIndex(child => child.path > this.path);

                if (insertIndex === -1) {
                    // Insert at end
                    siblings.push(this);
                } else {
                    // Insert at correct sorted position
                    siblings.splice(insertIndex, 0, this);
                }
            });
        }

    }

    get name(): string {
        return this.handle?.name;
    }

    async load(): Promise<void> {

    }

    /** Generic recursive search */
    getByPath<T extends LocalItem>(
        targetPath: string,
        type?: new (...args: any[]) => T
    ): T | null {
        if (this.path === targetPath) {
            if (!type || this instanceof type) return this as unknown as T;
            return null;
        }

        for (const child of this.children) {
            const found = child.getByPath(targetPath, type);
            if (found) return found;
        }
        return null;
    }

    /** Search from the root */
    getByAbsPath<T extends LocalItem>(
        targetPath: string,
        type?: new (...args: any[]) => T
    ): T | null {
        return this.root.getByPath(targetPath, type);
    }

    get root(): LocalItem {
        let current: LocalItem = this;
        while (current.parentFolder) { current = current.parentFolder; }
        return current;
    }

    log() { console.log(toJS(this)); }

    async delete(show_dialogue = false): Promise<void> {
        if (show_dialogue) {
            const confirmed = window.confirm(`Are you sure you want to delete "${this.name}"?`);
            if (!confirmed) return;
        }

        if (this.parentFolder) {
            await this.parentFolder.handle.removeEntry(this.name, { recursive: true });

            runInAction(() => {
                const index = this.parentFolder!.children.indexOf(this);
                if (index !== -1) { this.parentFolder!.children.splice(index, 1); }
            });
        }
    }
}