// Artbook.ts
import { action, makeObservable, observable, runInAction,toJS } from "mobx";
import { Art } from "./Art";
import { Project } from "./Project";
import { LocalFolder } from "./fileSystem/LocalFile";

export class Artbook extends LocalFolder{
  project: Project | null = null; 
  data: Record<string, Record<string, Art[]>> = {};

  constructor(handle: FileSystemDirectoryHandle, parentFolder: LocalFolder) {
    super(parentFolder, handle);
    this.project = parentFolder as Project;  // store the project pointer
    makeObservable(this, {
      project: observable.ref,   // observe reference only
      data: observable,          // deep observable
      load: action,      
    });
  }

  async load() {
    try {
      const result: Record<string, Record<string, Art[]>> = {};

      for await (const typeEntry of this.handle.values()) {
        if (typeEntry.kind !== "directory") continue;

        const typeName = typeEntry.name;
        const typeHandle = typeEntry as FileSystemDirectoryHandle;
        const typeFolder = new LocalFolder(this, typeHandle)

        const items: Record<string, Art[]> = {};

        for await (const itemEntry of typeHandle.values()) {
          if (itemEntry.kind !== "directory") continue;

          const itemName = itemEntry.name;
          const itemHandle = itemEntry as FileSystemDirectoryHandle;
          const itemFolder =  new LocalFolder(typeFolder, itemHandle)

          const arts: Art[] = [];

          for await (const imgEntry of itemHandle.values()) {
            if (imgEntry.kind !== "file") continue; // skip non-files
            if (!imgEntry.name.match(/\.(png|jpg|jpeg|webp|gif)$/i)) continue;            

            const fileHandle = imgEntry as FileSystemFileHandle; // now typed correctly
            const path = `${typeName}/${itemName}/${fileHandle.name}`;
            arts.push(new Art(fileHandle, itemFolder, path, this));
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

  log() {
    console.log(toJS(this));
  }

  getJson(): Record<string, Record<string, string[]>> {
    const result: Record<string, Record<string, string[]>> = {};

    for (const [typeName, items] of Object.entries(this.data)) {
      result[typeName] = {};

      for (const [itemName, arts] of Object.entries(items)) {
        result[typeName][itemName] = arts.map(art => art.handle.name);
      }
    }

    return result;
  }

}
