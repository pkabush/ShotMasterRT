// Scene.ts
import { LocalJson } from './LocalJson';
import { Shot } from './Shot';
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { Project } from './Project';
import { toJS } from "mobx";
//import { GoogleAI } from './GoogleAI';
import { ChatGPT } from './ChatGPT';
import { Art } from "./Art";
import Prompt from './Prompt';
import * as ResolveUtils from './ResolveUtils';
import { LocalFolder } from './fileSystem/LocalFile';

const default_sceneInfoJson = {
  tags: [],
  shotsjson: "",
  script: "",
  split_shots_prompt: {
    preset: "split_shots",
  },
}

export class Scene extends LocalFolder {
  sceneJson: LocalJson | null = null;
  shots: Shot[] = [];
  project: Project; // <--- new pointer to parent project
  is_generating_shotsjson = false;
  is_generating_tags = false;
  is_generating_all_shot_images = false;
  split_shots_prompt: Prompt | null = null;
  selectedShot: Shot | null = null;

  constructor(handle: FileSystemDirectoryHandle, project: Project, parentFolder: LocalFolder) {
    super(parentFolder, handle);

    this.project = project; // assign parent project
    // makeObservable instead of makeAutoObservable
    makeObservable(this, {
      sceneJson: observable,
      shots: observable,
      is_generating_shotsjson: observable,
      is_generating_tags: observable,
      is_generating_all_shot_images: observable,
      split_shots_prompt: observable,
      selectedShot: observable,
      finishedShotsNum: computed,
      tags: computed,
      selectShot: action,
    });
  }


  selectShot(shot: Shot) {
    if (this.shots.includes(shot)) {
      this.selectedShot = shot;
    }
  }

  async load(): Promise<void> {
    try {
      this.sceneJson = await LocalJson.create(this.handle, 'sceneinfo.json', default_sceneInfoJson);

      this.shots = [];
      for await (const handle of this.handle.values()) {
        if (handle.kind === 'directory') {
          const shot = new Shot(handle as FileSystemDirectoryHandle, this);
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
    if (!this.project?.handle) {
      console.error("Cannot delete scene: project root not set");
      return;
    }

    try {
      const scenesFolder = await this.project.handle.getDirectoryHandle("SCENES");
      await scenesFolder.removeEntry(this.name, { recursive: true });

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
    if (!this.handle) {
      console.error("No scene folder available");
      return null;
    }

    // Check if the shot already exists
    const existingShot = this.shots.find(s => s.name === shotName);
    if (existingShot) {
      return existingShot;
    }

    try {
      const shotFolder = await this.handle.getDirectoryHandle(shotName, { create: true });
      const shot = new Shot(shotFolder, this);
      await shot.load();

      // Insert shot alphabetically by folder name
      runInAction(() => {
        const index = this.shots.findIndex(s => s.name.localeCompare(shotName) > 0);
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

  getShotsWithStatus(status: string, exact = false): number {
    const keys = Object.keys(Shot.shot_states);
    const targetIndex = keys.indexOf(status);

    if (targetIndex === -1) return 0;

    return this.shots.filter((shot) => {
      // Use first key as default if shot_state is missing
      const shotState = shot.shotJson?.data?.shot_state ?? keys[0];
      const shotIndex = keys.indexOf(shotState);

      if (exact) {
        // only count shots exactly matching the target status
        return shotIndex === targetIndex;
      } else {
        // inclusive: count shots with status >= target status
        return shotIndex >= targetIndex;
      }
    }).length;
  }

  async generateShotsJson(): Promise<string | null> {
    if (!this.sceneJson?.data?.script) return null;

    runInAction(() => { this.is_generating_shotsjson = true; });

    const scriptText = this.sceneJson.data.script;

    const prompt = `
${this.project.workflows.split_scene_into_shots.prompt}

${this.sceneJson.data.split_prompt}

SCRIPT:
${scriptText}
`;

    const system_msg = this.project.projinfo?.getField("workflows/split_scene_into_shots/system_message")

    try {
      // Call ChatGPT with prompt + system message
      const res = await ChatGPT.txt2txt(prompt, system_msg, this.project?.projinfo?.getField("workflows/split_scene_into_shots/model"));
      // txt2txt returns string | null
      return res;
    } catch (err) {
      console.error("Error generating shots JSON:", err);
      return null;
    } finally {
      runInAction(() => { this.is_generating_shotsjson = false; });
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

  log() {
    console.log(toJS(this));
  }

  getTags(): Art[] {
    if (!this.sceneJson?.data?.tags || !this.project?.artbook) return [];

    const arts: Art[] = [];

    for (const tagPath of this.sceneJson.data.tags) {
      const art = this.project.artbook.getTag(tagPath);
      if (art) arts.push(art);
    }
    return arts;
  }

  get tags(): Art[] {
    return this.getTags();
  }

  async generateTags() {

    runInAction(() => { this.is_generating_tags = true; });

    const prompt = `
${this.project?.projinfo?.data?.generate_tags_prompt}

SCRIPT:
${this.sceneJson?.data.script}

SHOTS JSON:
${this.sceneJson?.data.shotsjson}

REFS DICTIONARY:
${JSON.stringify(this.project?.artbook?.getJson(), null, 2)}

`;

    const system_msg = "You are a helpful assistant. " +
      "Do not write explanations. "

    try {
      const res = await ChatGPT.txt2txt(prompt, system_msg, this.project?.projinfo?.data.gpt_model);
      //console.log(res);

      for (const tag_str of res?.split("\n") || []) {
        const trimmedTag = tag_str.trim();   // <-- remove leading/trailing whitespace
        if (!trimmedTag) continue;           // skip empty lines
        console.log("Adding Tag: ", trimmedTag);
        this.addTag(trimmedTag);
      }

      return res;
    } catch (err) {
      console.error("Error generating tags:", err);
      return null;
    } finally {
      runInAction(() => { this.is_generating_tags = false; });
    }

  }

  addTag(tag_str: string) {
    runInAction(() => {
      //console.log(tag_str, this.sceneJson?.data.tags);

      if (!this.sceneJson?.data.tags.includes(tag_str)) {
        if (this.project?.artbook?.getTag(tag_str)) {
          this.sceneJson?.data.tags.push(tag_str);
          this.sceneJson?.save();
        } else {
          console.log("Tag not found: ", tag_str);
        }
      }
    });
  }

  async generateAllShotImages() {
    runInAction(() => {
      this.is_generating_all_shot_images = true;
    });

    const tasks = this.shots
      .filter(shot => !shot.srcImage)
      .map(shot => shot.GenerateImage());

    await Promise.all(tasks);

    runInAction(() => {
      this.is_generating_all_shot_images = false;
    });
  }

  async createResolveXML() {

    const timeline = new ResolveUtils.FCPXMLBuilder(this.name);
    let offsetFrames = 1000;

    const timelineFolder = await LocalFolder.open( this.project.timelinesDirHandle, this.name  );

    for (const shot of this.shots) {
      let id = "r1"
      const durationFrames = 5;
      const name = this.name + "_" + shot.name
      if (shot.srcImage) {
        const new_img = await shot.srcImage.copyToFolder(timelineFolder, "img_" + name);
        const img_path = this.project.projinfo?.getField("project_path") + new_img.path
        id = timeline.addAsset(img_path, "img_" + name)!;
      }

      if (shot.outVideo) {
        const new_vod = await shot.outVideo.copyToFolder(timelineFolder, "vod_" + name);
        const vod_path = this.project.projinfo?.getField("project_path") + new_vod.path;
        const vod_id = timeline.addAsset(vod_path, "vod_" + name, true, durationFrames)!;
        timeline.appendClip(vod_id, "vod_" + name, durationFrames, offsetFrames, 1);
      }

      if (shot.outVideoLipsync) {
        const new_vod = await shot.outVideoLipsync.copyToFolder(timelineFolder, "vodLS_" + name);
        const vod_path = this.project.projinfo?.getField("project_path") + new_vod.path;
        const vod_id = timeline.addAsset(vod_path, "vodLS_" + name, true, durationFrames)!;
        timeline.appendClip(vod_id, "vodLS_" + name, durationFrames, offsetFrames, 2);
      }


      timeline.appendClip(id, name, durationFrames, offsetFrames);
      timeline.appendText(name, durationFrames, offsetFrames,3);

      offsetFrames += durationFrames;
    }

    timeline.log()
    timeline.save(this.project.timelinesDirHandle?.handle!);
  }

}
