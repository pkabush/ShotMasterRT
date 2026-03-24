import { action, makeObservable, observable, runInAction } from "mobx";
import type { LocalFolder } from "./LocalFolder";
import { LocalItem } from "./LocalItem";



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

