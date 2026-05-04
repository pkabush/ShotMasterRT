// Artbook.ts
import { action, makeObservable, observable } from "mobx";
import { Project } from "./Project";
import { LocalFolder } from "./fileSystem/LocalFolder";
import { MediaFolder } from "./MediaFolder";
import { Character } from "./Artbook/Character";
import { LocalImage } from "./fileSystem/LocalImage";


export class Artbook extends LocalFolder {
  project: Project | null = null;

  characters_folder: LocalFolder | null = null;
  environment_folder: LocalFolder | null = null;

  workflows = {
    gen_char_names: "artbook_generate_character_names",
    gen_location_names: "artbook_generate_location_names",
  }

  fields = {
    charlist: "artbook/charlist",
    location_list: "artbook/location_list"
  }


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
    await this.load_files()
    //console.log("AB", this)

    this.characters_folder = await LocalFolder.open(this, "ПЕРСОНАЖИ")
    this.environment_folder = await LocalFolder.open(this, "ЛОКАЦИИ")

    for (const artSubfolder of this.subfolders) {
      await artSubfolder.load_subfolders(Character);

      for (const characterFolder of artSubfolder.getType(MediaFolder)) {
        //await characterFolder.load_files();
        characterFolder.load();
      }
    }
  }

  get tags_list(): string[] {
    const tags = []
    for (const sub of this.getType(LocalFolder)) {
      for (const char of sub.getType(LocalFolder)) {
        for (const tag of char.getType(LocalImage)) {
          tags.push(tag.path);
        }
      }
    }
    return tags
  }

  async getBaseCharRef() {
    let img_ref = this.getByPath("/REFS/CharRef.jpg")
    if (!img_ref) {
      img_ref = await this.downloadFromUrl("https://pkabush.github.io/ShotMasterRT/assets/CharRef.jpg");
    }

    return img_ref;
  }

  async exportAllImages() {
    console.log(this);
    const artboook_out = await LocalFolder.open(this.project!.timelinesDirHandle!, "Artbook");

    for (const sub of this.getType(LocalFolder)) {
      for (const char of sub.getType(LocalFolder)) {
        for (const tag of char.getType(LocalImage)) {
          console.log(tag.path.replaceAll("/","_"));
          tag.copyToFolder(artboook_out,tag.path.replaceAll("/","_"));
        }
      }
    }



  }
}
