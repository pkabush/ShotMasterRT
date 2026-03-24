// Scene.ts
import { LocalJson } from './LocalJson';
import { Shot } from './Shot';
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { Project } from './Project';
//import { GoogleAI } from './GoogleAI';
import { ChatGPT } from './ChatGPT';
import Prompt from './Prompt';
import * as ResolveUtils from './ResolveUtils';
import { LocalFolder } from './fileSystem/LocalFolder';
import { Tags } from './Tags';
import { AI } from './AI_provider';
import { Storyboard } from './Storyboard';

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
  is_generating_shotsjson = false;
  is_generating_tags = false;
  is_generating_all_shot_images = false;
  split_shots_prompt: Prompt | null = null;
  selectedShot: Shot | null = null;
  references: Tags | null = null;
  storyboard: Storyboard | null = null;

  workflows = {
    generate_tags: "generate_tags_for_scene"
  }

  fields = {
    generated_tags_list: "generated_tags_list"
  }

  get project(){
    return Project.getProject(); 
  }

  constructor(parentFolder: LocalFolder|null,handle: FileSystemDirectoryHandle) {
    super(parentFolder, handle);
    
    // makeObservable instead of makeAutoObservable
    makeObservable(this, {
      sceneJson: observable,
      is_generating_shotsjson: observable,
      is_generating_tags: observable,
      is_generating_all_shot_images: observable,
      split_shots_prompt: observable,
      selectedShot: observable,
      references: observable,
      finishedShotsNum: computed,
      selectShot: action,
      shots: computed,
      project:computed,
    });
  }

  get shots() { return this.getType(Shot); }

  selectShot(shot: Shot) {
    if (this.shots.includes(shot)) {
      this.selectedShot = shot;
    }
  }

  async load(): Promise<void> {
    try {
      this.sceneJson = await LocalJson.create(this.handle, 'sceneinfo.json', default_sceneInfoJson);
      this.references = new Tags(this, this.sceneJson);
      await this.load_subfolders(Shot);
      // Load StoryBoard Later to overwrite
      this.storyboard = await LocalFolder.open(this,"Storyboard",Storyboard);
    } catch (err) {
      console.error('Error loading scene:', err);
      this.sceneJson = null;
    }
  }

  // create Shot
  async createShot(shotName?: string): Promise<Shot | null> {
    if (!shotName) shotName = this.nextShotName;

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
      const shot = LocalFolder.open(this, shotName, Shot);
      return shot;
    } catch (err) {
      console.error("Failed to create shot:", err);
      return null;
    }
  }

  get nextShotName(): string {
    const numbers = this.shots
      .map(shot => {
        const match = shot.name.match(/^SHOT_(\d+)$/);
        if (!match) return null;
        const rawNumber = parseInt(match[1], 10);
        // Strip last digit (floor to nearest 10)
        return Math.floor(rawNumber / 10) * 10;
      })
      .filter((n): n is number => n !== null);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 10;
    const padded = nextNumber.toString().padStart(3, '0');
    return `SHOT_${padded}`;
  }

  get finishedShotsNum(): number {
    return this.shots.filter(shot => shot.shotJson?.data?.finished).length;
  }

  getShotsWithStatus(status: string, exact = false): number {
    const keys = Shot.shot_states_keys;
    const targetIndex = keys.indexOf(status);

    if (targetIndex === -1) return 0;

    return this.shots.filter((shot) => {
      const shotState = shot.state;
      const shotIndex = keys.indexOf(shotState);

      if (exact) {
        return shotIndex === targetIndex;
      } else {
        return shotIndex >= targetIndex;
      }
    }).length;
  }

  get script() {
    return this.sceneJson?.data?.script;
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

    const timelineFolder = await LocalFolder.open(this.project.timelinesDirHandle, this.name);

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

      // Add Black Frame or Image If Generated
      timeline.appendClip(id, name, durationFrames, offsetFrames);

      let extra = 1;
      for (const extra_vod of shot.pickedExtraVideo) {
        const new_vod = await extra_vod.copyToFolder(timelineFolder, "vod_" + name + "_extraVod_" + `${extra}`);
        const vod_path = this.project.projinfo?.getField("project_path") + new_vod.path;
        const vod_id = timeline.addAsset(vod_path, "vod_" + name, true, durationFrames)!;
        timeline.appendClip(vod_id, "vod_" + name, durationFrames, offsetFrames + extra * durationFrames, 1);
        extra += 1;
      }

      // Label
      timeline.appendText(name, durationFrames + (extra - 1) * durationFrames, offsetFrames, 3);
      offsetFrames += durationFrames + (extra - 1) * durationFrames;

    }

    timeline.log()
    timeline.save(this.project.timelinesDirHandle?.handle!);
  }

  async generateTags() {
    runInAction(() => { this.is_generating_tags = true; });
    const workflow = this.project.workflows[this.workflows.generate_tags]

    const prompt = `
${workflow.prompt ?? ""}

SCRIPT:
${this.sceneJson?.data.script}

SHOTS JSON:
${this.sceneJson?.data.shotsjson}

REFS DICTIONARY:
${this.project.artbook?.tags_list.join("\n")}

`;

    const res = await AI.GenerateText({
      prompt: prompt,
      model: workflow.model!,
    })
    this.sceneJson?.updateField(this.fields.generated_tags_list, res);
    runInAction(() => { this.is_generating_tags = false; });
  }

  addGeneratedTags() {
    this.sceneJson?.getField(this.fields.generated_tags_list).split("\n").map(
      (tag: string) => {
        if (this.getByAbsPath(tag)) {
          this.references?.addTag(tag);
        } else {
          console.log("MISSING TAG: ", tag)
        }
      })
  }

  async delete(show_dialogue= false) {
    await super.delete(show_dialogue);

    if (this.project.selectedScene == this)
      this.project.setView( {type:"none"} );
  }

}
