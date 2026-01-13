// Shot.ts
import { Scene } from './Scene';
import { LocalJson } from './LocalJson';
import { LocalImage } from './LocalImage';
import { makeAutoObservable, runInAction,toJS } from "mobx";
import { GoogleAI } from './GoogleAI'; 
import { KlingAI } from './KlingAI';
//import { Art } from "./Art";


export class Shot {
  folder: FileSystemDirectoryHandle;
  scene: Scene;
  shotJson: LocalJson | null = null;
  images: LocalImage[] = [];
  srcImage: LocalImage | null = null;
  resultsFolder: FileSystemDirectoryHandle | null = null; // <--- store results folder
  is_generating = false;
  selected_art:LocalImage | null = null;

  constructor(folder: FileSystemDirectoryHandle, scene: Scene) {
    this.folder = folder;
    this.scene = scene;
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    try {
      this.shotJson = await LocalJson.create(this.folder, 'shotinfo.json');

      this.images = [];
      this.srcImage = null;

      // Try to get or create results folder
      try {
        this.resultsFolder = await this.folder.getDirectoryHandle('results', { create: true });

        for await (const [name, handle] of this.resultsFolder.entries()) {
          if (handle.kind === 'file') {
            const localImage = new LocalImage(handle as FileSystemFileHandle,this.resultsFolder);
            this.images.push(localImage);

            if (this.shotJson.data?.srcImage && name === this.shotJson.data.srcImage) {
              this.srcImage = localImage;
            }
          }
        }
      } catch (err) {
        console.warn('No results folder found or failed to read:', err);
        this.resultsFolder = null;
      }
    } catch (err) {
      console.error('Error loading shot:', this.folder.name, err);
      this.shotJson = null;
      this.images = [];
      this.srcImage = null;
      this.resultsFolder = null;
    }
  }

  setSrcImage(image: LocalImage | null) {
    this.srcImage = image;

    if (this.shotJson?.data) {
      this.shotJson.data.srcImage = image?.handle.name;
      this.shotJson.save();
    }
  }

  async delete(): Promise<void> {
    if (!this.scene?.folder) {
      console.error("Cannot delete shot: scene folder not set");
      return;
    }

    try {
      await this.scene.folder.removeEntry(this.folder.name, { recursive: true });

      runInAction(() => {
        this.scene.shots = this.scene.shots.filter(s => s !== this);
      });
    } catch (err) {
      console.error("Failed to delete shot:", err);
    }
  }

  addImage(image: LocalImage) {
    this.images.push(image);
    //console.log("SRC",this.srcImage);
    if (!this.srcImage) {this.setSrcImage(image);}
  }

  removeImage(image: LocalImage) {
    // Remove from array
    this.images = this.images.filter(i => i !== image);

    // If it was the source image, clear it
    if (this.srcImage === image) {
      this.setSrcImage(null);
    }
  }

  async GenerateVideo() {
    let prompt = this.shotJson?.data.prompt || "";

    KlingAI.txt2video(prompt,{
      accessKey: this.scene.project.userSettingsDB.data.api_keys.Kling_Acess_Key,
      secretKey: this.scene.project.userSettingsDB.data.api_keys.Kling_Secret_Key
    });

  }

  async GenerateImage() {
    if (!this.resultsFolder) {
      console.warn("Results folder not set. Attempting to create one...");
      try {
        this.resultsFolder = await this.folder.getDirectoryHandle('results', { create: true });
      } catch (err) {
        console.error("Failed to create results folder:", err);
        return;
      }
    }

    runInAction(() => {
      this.is_generating = true; // start generating
    });

    // add input images, skipping any skipped tags
    const skipped = this.getSkippedTags();
    const images: { rawBase64: string; mime: string;description:string }[] = [];

    //const image_paths = [];
    for (const art of this.scene.getTags()) {
      if (skipped.includes(art.path)) continue; // skip this tag

      try {
        const base64Obj = await art.image.getBase64(); // uses cached Base64 if available
        //images.push(base64Obj);
        images.push({ rawBase64:base64Obj.rawBase64, mime:base64Obj.mime, description:art.path});

        //image_paths.push(art.path);
      } catch (err) {
        console.warn("Failed to load tag image:", art.path, err);
      }
    }
    
    let prompt = this.shotJson?.data.prompt || "";
    //if (image_paths.length > 0) { prompt += `\n\nИспользуй эти картинки как референсы:\n${image_paths.join("\n")}`; }

    try {
      const result = await GoogleAI.img2img(prompt || "",this.scene.project.workflows.generate_shot_image.model,images);
      const localImage:LocalImage|null = await GoogleAI.saveResultImage(result,this.resultsFolder);
      if (localImage) this.addImage(localImage);
    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
    runInAction(() => {
      this.is_generating = false; // start generating
    });
    }
  }  

  log() {console.log(toJS(this));}

  selectArt(art : LocalImage|null = null) {
    runInAction(() => { this.selected_art = art; });
  }

  async saveGoogleResultImage(result:any,select:boolean = false){
      const localImage:LocalImage|null = await GoogleAI.saveResultImage(result,this.resultsFolder as FileSystemDirectoryHandle);
      if (localImage) {
        this.addImage(localImage);      
        if(select) this.selectArt(localImage);
      }      
  }

  getSkippedTags(): string[] {
    return this.shotJson?.data?.skippedTags || [];
  }

  setTagSkipped(tag_path: string, status: boolean) {
    if (!this.shotJson?.data) return;

    // ensure skippedTags is initialized
    if (!Array.isArray(this.shotJson.data.skippedTags)) {
      this.shotJson.data.skippedTags = [];
    }

    runInAction(() => {
      const tags = this.shotJson!.data!.skippedTags;

      if (status) {
        if (!tags.includes(tag_path)) {
          tags.push(tag_path);
        }
      } else {
        this.shotJson!.data!.skippedTags = tags.filter((t: string) => t !== tag_path);
      }
    });

    // persist to JSON after mutation
    this.shotJson.save();
  }

  

}
