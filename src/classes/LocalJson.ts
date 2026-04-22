import { makeObservable, observable, runInAction, toJS } from "mobx";
import { LocalFile } from "./fileSystem/LocalFile";
import type { LocalFolder } from "./fileSystem/LocalFolder";

export class LocalJson extends LocalFile {
  data: Record<string, any> = {};

  constructor(
    parentFolder: LocalFolder,
    handle: FileSystemFileHandle,
  ) {
    super(parentFolder, handle);

    makeObservable(this, {
      data: observable,
    });

  }

  async load() {
    const file = await this.handle.getFile();
    const text = await file.text();

    let data = {};

    if (text.trim() !== "") {
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.warn("Invalid JSON, resetting:", err);
      }
    }

    runInAction(() => {
      this.data = data;
    });
  }

  static async create(
    folder: LocalFolder,
    filename: string,
    defaultData: Record<string, any> = {}
  ): Promise<LocalJson> {
    const handle = await folder.handle.getFileHandle(filename, { create: true });

    const localJson = new LocalJson(folder, handle);
    await localJson.load();

    runInAction(() => {
      localJson.data = { ...defaultData, ...localJson.data }
    })

    return localJson;
  }


  private saveTimeout: any = null;

  scheduleSave(delay = 200) {
    if (this.saveTimeout) {      
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {      
      this.save();
    }, delay);
  }

  /**
   * Save JSON to disk. Creates the file if it doesn't exist yet.
   * Deletes the file if data is empty.
   */
  async save(): Promise<void> {
    try {
      // If data is empty → delete file if it exists
      if (this.isEmptyObject(this.data)) {
        await this.delete();
        return;
      }

      // Lazy-create file if missing
      /*
      if (!this.handle) {
        this.handle = await this.folderHandle.getFileHandle(this.filename, { create: true });
      }*/

      let permission = await this.handle.queryPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        permission = await this.handle.requestPermission({ mode: "readwrite" });
      }
      if (permission !== "granted") throw new Error("No permission to write file");

      const writable = await this.handle.createWritable();
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

    if (save) await this.scheduleSave();
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

  getOrCreateField(fieldPath: string, defaultValue: any) {
    const existing = this.getField(fieldPath);
    if (existing !== undefined) return existing;

    this.updateField(fieldPath, defaultValue, false);
    return defaultValue;
  }

  private isEmptyObject(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0;
  }

  log() {
    console.log(toJS(this));
  }
}
