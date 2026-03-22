import { action, makeObservable, observable, runInAction, toJS } from "mobx";
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
        // Check if a child with the same path already exists
        const existingIndex = this.parentFolder!.children.findIndex(
          child => child.path === this.path
        );
        if (existingIndex !== -1) {
          // Replace the existing child
          this.parentFolder!.children[existingIndex] = this;
        } else {
          // Add normally
          this.parentFolder!.children.push(this);
        }
      });
    }

  }

  abstract get name(): string;
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
        if (index !== -1) {
          this.parentFolder!.children.splice(index, 1);
        }
      });
    }
  }
}

export class LocalFile extends LocalItem {
  handle: FileSystemFileHandle;
  private _file: File | null = null;
  lastModified: number = 0;

  constructor(
    parentFolder: LocalFolder | null = null,
    handle: FileSystemFileHandle
  ) {
    super(parentFolder, handle);
    this.handle = handle;


    makeObservable(this, {
      lastModified: observable,
      getFile: action.bound, // action.bound ensures proper this context
      delete: action.bound,
    });
  }

  get name(): string {
    return this.handle.name;
  }

  get name_no_extension(): string {
    const dotIndex = this.name.lastIndexOf(".");
    return dotIndex !== -1 ? this.name.slice(0, dotIndex) : this.name;
  }

  async getFile(forceRefresh = false): Promise<File> {
    if (!this._file || forceRefresh) {
      const file = await this.handle.getFile();

      runInAction(() => {
        this._file = file;
        this.lastModified = file.lastModified;
      });

    }
    return this._file!;
  }

  async copyToFolder(targetFolder: LocalFolder, new_name?: string): Promise<LocalFile> {
    const file = await this.getFile();

    // Determine the final file name
    let finalName = this.name;
    if (new_name) {
      const extension = this.name.includes(".")
        ? this.name.substring(this.name.lastIndexOf("."))
        : "";
      finalName = new_name + extension;
    }

    let newHandle: FileSystemFileHandle;

    try {
      // Try to get existing file
      newHandle = await targetFolder.handle.getFileHandle(finalName);
      const existingFile = await newHandle.getFile();

      if (existingFile.size === file.size) {
        // Same size → do nothing, return existing file
        return new LocalFile(targetFolder, newHandle);
      }
      // Different size → overwrite
    } catch (err) {
      // File doesn't exist → create it
      newHandle = await targetFolder.handle.getFileHandle(finalName, { create: true });
    }

    // Write the contents (overwrite if needed)
    const writable = await newHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // Return a new LocalFile instance
    return targetFolder.load_file(newHandle);
  }

  async load(): Promise<void> {

  }

}

