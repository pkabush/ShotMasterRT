// Scene.ts
import { LocalJson } from './LocalJson';
import { Shot } from './Shot';
import { makeAutoObservable, runInAction } from "mobx";
import { Project } from './Project';
import { toJS } from "mobx";
import { GoogleAI } from './GoogleAI';
import {ChatGPT} from './ChatGPT';

export class Scene {
  folder: FileSystemDirectoryHandle;
  sceneJson: LocalJson | null = null;
  shots: Shot[] = [];
  project: Project | null = null; // <--- new pointer to parent project

 constructor(folder: FileSystemDirectoryHandle, project: Project | null = null) {
    this.folder = folder;
    this.project = project; // assign parent project
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    try {
      this.sceneJson = await LocalJson.create(this.folder, 'sceneinfo.json', {tags:[],shotsjson:"",script:""});

      this.shots = [];
      for await (const [name, handle] of this.folder.entries()) {
        if (handle.kind === 'directory') {
          const shot = new Shot(handle, this);
          await shot.load(); // load shotinfo.json
          this.shots.push(shot);
        }
      }
    } catch (err) {
      console.error('Error loading scene:', err);
      this.sceneJson = null;
      this.shots = [];
    }
  }

  removeTag(path: string) {
    if (!this.sceneJson?.data?.tags) return;

    // Directly mutate the observable array
    this.sceneJson.data.tags = this.sceneJson.data.tags.filter(
      (tag: string) => tag !== path
    );

    this.sceneJson.save();
  }

  async delete(): Promise<void> {
    if (!this.project?.rootDirHandle) {
      console.error("Cannot delete scene: project root not set");
      return;
    }

    try {
      const scenesFolder = await this.project.rootDirHandle.getDirectoryHandle("SCENES");
      await scenesFolder.removeEntry(this.folder.name, { recursive: true });

      runInAction(() => {
        if (this.project) {
          this.project.scenes = this.project.scenes.filter(s => s !== this);
        }
      });

    } catch (err) {
      console.error("Failed to delete scene:", err);
    }
  }

  // create Shot
  async createShot(shotName: string): Promise<Shot | null> {
    if (!this.folder) {
      console.error("No scene folder available");
      return null;
    }

    // Check if the shot already exists
    const existingShot = this.shots.find(s => s.folder.name === shotName);
    if (existingShot) {
      return existingShot;
    }

    try {
      const shotFolder = await this.folder.getDirectoryHandle(shotName, { create: true });
      const shot = new Shot(shotFolder, this);
      await shot.load();

      // Insert shot alphabetically by folder name
      runInAction(() => {
        const index = this.shots.findIndex(s => s.folder.name.localeCompare(shotName) > 0);
        if (index === -1) this.shots.push(shot);
        else this.shots.splice(index, 0, shot);
      });

      return shot;
    } catch (err) {
      console.error("Failed to create shot:", err);
      return null;
    }
  }

  get finishedShotsNum(): number {
    return this.shots.filter(shot => shot.shotJson?.data?.finished).length;
  }

  async generateShotsJson(): Promise<string | null> {
    if (!this.sceneJson?.data?.script) return null;

    const scriptText = this.sceneJson.data.script;

    const prompt = `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}   

СЦЕНА:
${scriptText}
`;


    const system_msg =  "You are a helpful assistant. " +
            "Always respond using ONLY valid JSON. " +
            "Do not write explanations. " +
            "Do not wrap the JSON in backticks. " +
            "The entire response must be a valid JSON object." 


  try {
    // Call ChatGPT with prompt + system message
    const res = await ChatGPT.txt2txt(prompt, system_msg);
    // txt2txt returns string | null
    return res;
  } catch (err) {
    console.error("Error generating shots JSON:", err);
    return null;
  }

  }

  // Scene.ts
  async createShotsFromShotsJson() {
    if (!this.sceneJson?.data?.shotsjson) {
      console.warn("No shots JSON found in scene.");
      return;
    }

    let shotsData: Record<string, any>;
    try {
      shotsData = JSON.parse(this.sceneJson.data.shotsjson);
    } catch (err) {
      console.error("Invalid shots JSON:", err);
      alert("Error: The shots JSON is invalid. Please check the format.");
      return;
    }

    for (const shotKey of Object.keys(shotsData)) {
      const shotInfo = shotsData[shotKey];
      if (!shotInfo || typeof shotInfo !== "object") {
        console.warn(`Skipping invalid shot data for key: ${shotKey}`);
        continue;
      }

      try {
        const shot = await this.createShot(shotKey);
        if (!shot) {
          console.error(`Failed to create shot ${shotKey}`);
          continue;
        }

        // Save shot details to its JSON
        if (shot.shotJson) {
          Object.assign(shot.shotJson.data, shotInfo);
          await shot.shotJson.save();
        }

      } catch (err) {
        console.error(`Error creating shot ${shotKey}:`, err);
      }
    }
  }

  log(){
    console.log(toJS(this));    
  }

}
