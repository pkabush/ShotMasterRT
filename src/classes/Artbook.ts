// Artbook.ts
import { makeAutoObservable, runInAction } from "mobx";
import { Art } from "./Art";
import { Project } from "./Project";

export class Artbook {
  rootHandle: FileSystemDirectoryHandle | null = null;
  project: Project | null = null; 
  data: Record<string, Record<string, Art[]>> = {};

  constructor(rootHandle: FileSystemDirectoryHandle | null = null, project: Project | null = null) {
    this.rootHandle = rootHandle;
    this.project = project;  // store the project pointer
    makeAutoObservable(this);
  }

  async load() {
    if (!this.rootHandle) return;

    try {
      const result: Record<string, Record<string, Art[]>> = {};

      for await (const typeEntry of this.rootHandle.values()) {
        if (typeEntry.kind !== "directory") continue;

        const typeName = typeEntry.name;
        const typeHandle = typeEntry as FileSystemDirectoryHandle;

        const items: Record<string, Art[]> = {};

        for await (const itemEntry of typeHandle.values()) {
          if (itemEntry.kind !== "directory") continue;

          const itemName = itemEntry.name;
          const itemHandle = itemEntry as FileSystemDirectoryHandle;

          const arts: Art[] = [];

          for await (const imgEntry of itemHandle.values()) {
            if (imgEntry.kind !== "file") continue; // skip non-files
            if (!imgEntry.name.match(/\.(png|jpg|jpeg|webp|gif)$/i)) continue;

            const fileHandle = imgEntry as FileSystemFileHandle; // now typed correctly
            const path = `${typeName}/${itemName}/${fileHandle.name}`;
            arts.push(new Art(fileHandle, itemHandle, path, this));
          }

          items[itemName] = arts;
        }

        result[typeName] = items;
      }

      runInAction(() => {
        this.data = result;
      });
    } catch (err) {
      console.error("Error loading artbook:", err);
      runInAction(() => {
        this.data = {};
      });
    }
  }

  getTag(path: string): Art | null {
    if (!path) return null;
    const parts = path.split("/"); // ["TYPE", "ITEM", "FILE"]
    if (parts.length < 3) return null;

    const [typeName, itemName, fileName] = parts;
    const type = this.data[typeName];
    if (!type) return null;

    const item = type[itemName];
    if (!item) return null;

    const art = item.find(a => a.handle.name === fileName);
    return art || null;
  }
}
