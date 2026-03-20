import { action, makeObservable, observable, runInAction, toJS } from "mobx";
import type { LocalFolder } from "./LocalFolder";

// LocalItem.ts
export abstract class LocalItem {
  path: string = "";
  parentFolder: LocalFolder | null;

  children: LocalItem[] = [];

  constructor(parentFolder: LocalFolder | null = null) {
    this.parentFolder = parentFolder;

    makeObservable(this, {
      children: observable, // <-- add this
    });

    runInAction(() => {
      this.parentFolder?.children.push(this);
    })

  }

  abstract get name(): string;
  async load(): Promise<void> {

  }

  getByPath(targetPath: string): LocalItem | null {
    if (this.path === targetPath) return this;

    for (const child of this.children) {
      const found = child.getByPath(targetPath);
      if (found) return found;
    }
    return null;
  }

  getByAbsPath(targetPath: string): LocalItem | null {
    return this.root.getByPath(targetPath);
  }

  get root(): LocalItem {
    let current: LocalItem = this;
    while (current.parentFolder) { current = current.parentFolder; }
    return current;
  }

  log() { console.log(toJS(this)); }
}

export class LocalFile extends LocalItem {
  handle: FileSystemFileHandle;
  private _file: File | null = null;
  lastModified: number = 0;

  constructor(
    parentFolder: LocalFolder | null = null,
    handle: FileSystemFileHandle
  ) {
    super(parentFolder);
    this.handle = handle;
    this.path = (parentFolder?.path || "") + "/" + (handle?.name || "");

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


  async delete(show_dialogue = false): Promise<void> {
    if (!this.parentFolder) {
      throw new Error("Cannot delete file without parent folder");
    }

    // Ask user for confirmation
    if (show_dialogue) {
      const confirmed = window.confirm(`Are you sure you want to delete "${this.name}"?`);
      if (!confirmed) return; // user canceled
    }

    // Remove from filesystem
    await this.parentFolder.handle.removeEntry(this.name);

    // Remove from in-memory tree
    runInAction(() => {
      const index = this.parentFolder!.children.indexOf(this);
      if (index !== -1) {
        this.parentFolder!.children.splice(index, 1);
      }
    });
  }

  async load(): Promise<void> {

  }

}

