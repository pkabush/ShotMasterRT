import { makeAutoObservable } from "mobx";
import type { Project } from "./Project";

export class Script {
  fileHandle: FileSystemFileHandle;
  text: string = "";
  scenes: Map<string, string> = new Map();  // observable Map  
  project: Project | null = null;           // parent project reference

  constructor(fileHandle: FileSystemFileHandle, project: Project | null = null) {
    this.fileHandle = fileHandle;
    this.project = project;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async load(): Promise<void> {
    const file = await this.fileHandle.getFile();
    this.text = (await file.text()).replace(/\r\n/g, "\n");
    this.splitIntoScenes();
  }

  async save(): Promise<void> {
    const writable = await this.fileHandle.createWritable();
    await writable.write(this.text);
    await writable.close();
  }

  setText(newText: string) {
    this.text = newText;
    this.splitIntoScenes();
  }

  splitIntoScenes() {
    this.scenes.clear();

    const regex = /^SC_[^\n]{1,32}$/gm;
    const matches = [...this.text.matchAll(regex)];

    if (matches.length === 0) {
      this.scenes.set("", this.text);
      return;
    }

    for (let i = 0; i < matches.length; i++) {
      const header = matches[i][0];
      const headerStart = matches[i].index!;

      // Text before first header
      if (i === 0 && headerStart > 0) {
        const introText = this.text.slice(0, headerStart);
        this.scenes.set("", introText);
      }

      const nextHeaderIndex =
        i + 1 < matches.length ? matches[i + 1].index! : this.text.length;

      const sceneText = this.text.slice(headerStart, nextHeaderIndex);
      this.scenes.set(header, sceneText);
    }
  }

  // Dynamically get scene names sorted alphabetically
  get sortedSceneKeys(): string[] {
    return Array.from(this.scenes.keys()).sort((a, b) => a.localeCompare(b));
  }

  joinScenes(): string {
    let combined = "";
    for (const key of this.sortedSceneKeys) {
      combined += this.scenes.get(key);
    }
    return combined;
  }

  setSceneText(key: string, newText: string) {
    this.scenes.set(key, newText);
    this.text = this.joinScenes();
    this.splitIntoScenes();
  }

  async createScenes() {
    if (!this.project) {
      console.error("Script has no project reference");
      return;
    }

    for (const key of this.sortedSceneKeys) {
      // Skip the first empty scene
      if (key === "") continue;

      const sceneText = this.scenes.get(key) ?? "";

      try {
        const scene = await this.project.createScene(key);
        if (!scene) {
          console.error(`Failed to create scene ${key}`);
          continue;
        }

        if (scene.sceneJson) {
          scene.sceneJson.data.script = sceneText;
          await scene.sceneJson.save();
        }

      } catch (err) {
        console.error(`Error creating scene ${key}:`, err);
      }
    }
  }
}
