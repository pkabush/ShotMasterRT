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

  constructor(
    parentFolder: LocalFolder | null = null,
    handle: FileSystemFileHandle
  ) {
    super(parentFolder);
    this.handle = handle;
    this.path = (parentFolder?.path || "") + "/" + (handle?.name || "");
  }

  get name(): string {
    return this.handle.name;
  }
}


export class LocalFolder extends LocalItem {
  handle: FileSystemDirectoryHandle;

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