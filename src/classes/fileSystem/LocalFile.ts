import { action, makeObservable, observable, runInAction } from "mobx";
import type { LocalFolder } from "./LocalFolder";
import { LocalItem } from "./LocalItem";



export class LocalFile extends LocalItem {
  handle: FileSystemFileHandle;
  private _file: File | null = null;
  lastModified: number = 0;
  size: number = 0;


  constructor(
    parentFolder: LocalFolder | null = null,
    handle: FileSystemFileHandle
  ) {
    super(parentFolder, handle);
    this.handle = handle;


    makeObservable(this, {
      lastModified: observable,
      size: observable,
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
        this.size = file.size;
      });

    }
    return this._file!;
  }

  async copyToFolder(targetFolder: LocalFolder, new_name?: string, forceReplace = false): Promise<LocalFile> {
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
      newHandle = await targetFolder.handle.getFileHandle(finalName);

      if (!forceReplace) {
        const existingFile = await newHandle.getFile();

        if (existingFile.size === file.size) {
          return new LocalFile(targetFolder, newHandle);
        }
      }
    } catch (err) {
      newHandle = await targetFolder.handle.getFileHandle(finalName, {
        create: true,
      });
    }

    // Write the contents (overwrite if needed)
    const writable = await newHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // Return a new LocalFile instance
    return await targetFolder.load_file(newHandle);
  }

  async load(): Promise<void> {

  }

  async rename(name: string): Promise<LocalFile | null> {
    if (!this.parentFolder) return null;
    const new_image = await this.copyToFolder(this.parentFolder, name);
    await this.delete();
    return new_image;
  }


  get formattedSize(): string {
    if (this.size < 1024) return `${this.size} B`;
    if (this.size < 1024 * 1024) return `${(this.size / 1024).toFixed(1)} KB`;
    if (this.size < 1024 * 1024 * 1024) return `${(this.size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(this.size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  get formattedLastModified(): string {
    if (!this.lastModified) return "Unknown";
    return new Date(this.lastModified).toLocaleString();
  }

  get lastModifiedDays(): number {
    if (!this.lastModified) return -1;
    const diff = Date.now() - this.lastModified;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }


}

