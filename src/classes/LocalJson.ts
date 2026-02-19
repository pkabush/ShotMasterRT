import { makeAutoObservable, observable, runInAction } from "mobx";

export class LocalJson {
  folderHandle: FileSystemDirectoryHandle;
  fileHandle: FileSystemFileHandle | null;
  filename: string;
  data: Record<string, any>;

  private constructor(
    folderHandle: FileSystemDirectoryHandle,
    filename: string,
    fileHandle: FileSystemFileHandle | null,
    data: Record<string, any>
  ) {
    this.folderHandle = folderHandle;
    this.filename = filename;
    this.fileHandle = fileHandle;
    this.data = observable(data); // observable data
    makeAutoObservable(this);
  }

  /**
   * Load an existing JSON file if it exists. 
   * Does NOT create a new file by default.
   */
  static async create(
    folderHandle: FileSystemDirectoryHandle,
    filename: string,
    defaultData: Record<string, any> = {}
  ): Promise<LocalJson> {
    try {
      const fileHandle = await folderHandle.getFileHandle(filename, { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = text.trim() === ""
        ? { ...defaultData }
        : { ...defaultData, ...JSON.parse(text) };
      return new LocalJson(folderHandle, filename, fileHandle, data);
    } catch {
      // File does not exist → start with in-memory data only
      return new LocalJson(folderHandle, filename, null, { ...defaultData });
    }
  }

  /**
   * Save JSON to disk. Creates the file if it doesn't exist yet.
   * Deletes the file if data is empty.
   */
  async save(): Promise<void> {
    try {
      // If data is empty → delete file if it exists
      if (this.isEmptyObject(this.data)) {
        if (this.fileHandle) {
          await this.folderHandle.removeEntry(this.filename);
          this.fileHandle = null;
        }
        return;
      }

      // Lazy-create file if missing
      if (!this.fileHandle) {
        this.fileHandle = await this.folderHandle.getFileHandle(this.filename, { create: true });
      }

      let permission = await this.fileHandle.queryPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        permission = await this.fileHandle.requestPermission({ mode: "readwrite" });
      }
      if (permission !== "granted") throw new Error("No permission to write file");

      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(this.data, null, 2));
      await writable.close();
    } catch (err) {
      console.error("Error saving JSON:", err);
    }
  }

  /**
   * Update a nested field in JSON.
   * Delete the key if value === undefined
   */
  async updateField(fieldPath: string, value: any, save: boolean = true): Promise<void> {
    runInAction(() => {
      const parts = fieldPath.split("/").filter(Boolean);
      let current: any = this.data;

      for (let i = 0; i < parts.length; i++) {
        const key = parts[i];

        if (i === parts.length - 1) {
          // Last segment → assign or delete
          if (value === undefined) {
            delete current[key];
          } else {
            current[key] = value;
          }
        } else {
          // Intermediate objects
          if (current[key] === undefined || current[key] === null || typeof current[key] !== "object") {
            current[key] = {};
          }
          current = current[key];
        }
      }
    });

    if (save) await this.save();
  }

  getField(fieldPath: string): any {
    const parts = fieldPath.split("/").filter(Boolean);
    let current: any = this.data;

    for (const key of parts) {
      if (current == null || typeof current !== "object") return undefined;
      current = current[key];
    }
    return current;
  }

  private isEmptyObject(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0;
  }
}
