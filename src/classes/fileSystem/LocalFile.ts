import { action, makeObservable, observable, runInAction } from "mobx";

// LocalItem.ts
export abstract class LocalItem {
  path: string = "";
  parentFolder: LocalFolder | null;

  private children: LocalItem[] = [];

  constructor(parentFolder: LocalFolder | null = null) {
    this.parentFolder = parentFolder;
    this.parentFolder?.children.push(this);
  }

  abstract get name(): string;

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
    });
  }

  get name(): string {
    return this.handle.name;
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
    return new LocalFile(targetFolder, newHandle);
  }
}


export class LocalFolder extends LocalItem {
  handle: FileSystemDirectoryHandle;

  static async open(
    parentFolder: LocalFolder | null,
    folderName: string
  ): Promise<LocalFolder> {
    if (!folderName) { throw new Error("Folder name cannot be empty"); }

    let handle: FileSystemDirectoryHandle;

    if (parentFolder) {
      // Get or create the folder inside parent
      handle = await parentFolder.handle.getDirectoryHandle(folderName, { create: true, });
    } else {
      // If no parent, assume root access is provided externally (browser permission required)
      throw new Error("Root folder access required. Provide a parent folder handle.");
    }

    return new LocalFolder(parentFolder, handle);
  }

  constructor(
    parentFolder: LocalFolder | null = null,
    handle: FileSystemDirectoryHandle
  ) {
    super(parentFolder);
    this.handle = handle;
    this.path = (parentFolder?.path || "") + "/" + (handle?.name || "");
  }

  get name(): string {
    return this.handle?.name;
  }
}