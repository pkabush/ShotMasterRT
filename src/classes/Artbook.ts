// Artbook.ts
import { action, makeObservable, observable } from "mobx";
import { Project } from "./Project";
import { LocalFolder } from "./fileSystem/LocalFolder";
import { MediaFolder } from "./MediaFolder";
import { Character } from "./Artbook/Character";

export class Artbook extends LocalFolder {
  project: Project | null = null;

  constructor(handle: FileSystemDirectoryHandle, parentFolder: LocalFolder) {
    super(parentFolder, handle);
    this.project = parentFolder as Project;  // store the project pointer
    makeObservable(this, {
      project: observable.ref,   // observe reference only
      load: action,
      createCharacter: action,
    });
  }

  async createCharacter(parent: LocalFolder, name?: string) {
    // Use prompt if name is not provided
    const finalName = name || prompt("Please enter something:");

    if (!finalName || finalName.trim() === "") {
      console.log("No name provided, exiting function.");
      return;
    }

    const new_char = await LocalFolder.open(parent, finalName, Character)
    await new_char.load();
  }

  async load() {
    // Load all subfolders and images    
    await this.load_subfolders();
    for (const artSubfolder of this.subfolders) {
      await artSubfolder.load_subfolders(Character);

      for (const characterFolder of artSubfolder.getType(MediaFolder)) {
        //await characterFolder.load_files();
        characterFolder.load();
      }
    }
  }
}
