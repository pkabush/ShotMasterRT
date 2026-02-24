// Shot.ts
import { Scene } from './Scene';
import { LocalJson } from './LocalJson';
import { LocalImage } from './fileSystem/LocalImage';
import { makeObservable, observable, runInAction, toJS } from "mobx";
import { GoogleAI, type AIImageInput } from './GoogleAI';
import { KlingAI, type LipSyncFaceChoose } from './KlingAI';
import { Task } from './Task';
//import { Art } from "./Art";
import { ai_providers } from './AI_providers';
import { LocalVideo } from './fileSystem/LocalVideo';
import { MediaFolder } from './MediaFolder';
import type { LocalAudio } from './fileSystem/LocalAudio';
import { LocalFolder } from './fileSystem/LocalFile';





export class Shot extends LocalFolder {
  shotJson: LocalJson | null = null;
  tasks: Task[] = [];

  // Processes
  is_submitting_video = false;
  is_generating = false;

  public static shot_states = {
    "started": "#575757ff",
    "image_ready": "#8aa200ff",
    "video_ready": "#007118",
  }

  // MediaFolders
  MediaFolder_results: MediaFolder | null = null;
  MediaFolder_genVideo: MediaFolder | null = null;
  MediaFolder_refVideo: MediaFolder | null = null;
  MediaFolder_Audio: MediaFolder | null = null;

  constructor(handle: FileSystemDirectoryHandle, scene: Scene) {
    super(scene, handle);

    // Use makeObservable because we extend LocalFolder
    makeObservable(this, {
      shotJson: observable,
      tasks: observable,
      is_submitting_video: observable,
      is_generating: observable,
      MediaFolder_results: observable,
      MediaFolder_genVideo: observable,
      MediaFolder_refVideo: observable,
      MediaFolder_Audio: observable,
    });
  }

  get scene(): Scene {
    return this.parentFolder as Scene;
  }

  get mediafolders() {
    return [this.MediaFolder_results, this.MediaFolder_Audio, this.MediaFolder_genVideo, this.MediaFolder_refVideo]
  }

  // GETTERS FOR CONVINIENCE
  get srcImage(): LocalImage | null {
    return this.MediaFolder_results!.getFirstMediaWithTag("start_frame") as LocalImage;
  }
  get end_frame(): LocalImage | null {
    return this.MediaFolder_results!.getFirstMediaWithTag("end_frame") as LocalImage;
  }
  get kling_motion_video(): LocalVideo | null {
    return this.MediaFolder_refVideo!.getFirstMediaWithTag("motion_ref") as LocalVideo;
  }
  get outVideo(): LocalVideo | null {
    return this.MediaFolder_genVideo!.getFirstMediaWithTag("picked") as LocalVideo;
  }
  get unreal_frame(): LocalImage | null {
    return this.MediaFolder_results!.getFirstMediaWithTag("unreal_frame") as LocalImage;
  }
  get kling_face_id_data(): any | null {
    if (!this.outVideo) return null;
    return this.shotJson?.getField("KlingFaceID/" + this.outVideo.name);
  }

  async load(): Promise<void> {
    try {
      this.shotJson = await LocalJson.create(this.handle, 'shotinfo.json');

      // Load Media Folders
      this.MediaFolder_results = await MediaFolder.create(this, "results");
      this.MediaFolder_results.tags = ["start_frame", "end_frame", "ref_frame", "unreal_frame"];


      this.MediaFolder_genVideo = await MediaFolder.create(this, "genVideo");
      this.MediaFolder_genVideo.tags = ["picked"];

      this.MediaFolder_refVideo = await MediaFolder.create(this, "refVideo");
      this.MediaFolder_refVideo.tags = ["motion_ref"];


      this.MediaFolder_Audio = await MediaFolder.create(this, "audio");
      this.MediaFolder_Audio.tags = ["ID-0", "ID-1", "ID-2"];

      // Load Tasks      
      this.loadTasks();

    } catch (err) {
      console.error('Error loading shot:', this.name, err);
      this.shotJson = null;
    }
  }

  loadTasks(): void {
    const tasksData = this.shotJson?.getField("tasks");
    runInAction(() => {
      this.tasks = [];
      if (!tasksData || typeof tasksData !== "object") return;
      for (const taskId of Object.keys(tasksData)) {
        this.tasks.push(new Task(this, taskId));
      }
    });
  }

  addTask(id: string, data?: any | null): Task {
    const task = new Task(this, id);
    runInAction(() => { this.tasks.push(task); });
    task.update(data);
    return task;
  }

  removeTask(task: Task) {
    runInAction(() => {
      this.tasks = this.tasks.filter(t => t !== task);
    });

    const tasks = this.shotJson?.getField("tasks") ?? {};
    delete tasks[task.id as string];
    this.shotJson?.updateField("tasks", tasks);
  }

  async delete(): Promise<void> {
    if (!this.scene?.handle) {
      console.error("Cannot delete shot: scene folder not set");
      return;
    }

    try {
      await this.scene.handle.removeEntry(this.name, { recursive: true });

      runInAction(() => {
        this.scene.shots = this.scene.shots.filter(s => s !== this);
      });
    } catch (err) {
      console.error("Failed to delete shot:", err);
    }
  }

  async GenerateVideo() {
    runInAction(() => {
      this.is_submitting_video = true;
    });

    const prompt = this.shotJson?.data.video_prompt || "";

    try {
      const workflow = this.scene.project.workflows.generate_video_kling;
      const model = workflow.model;

      let task_info: { id: string; workflow: string } | null = null;

      // ================= OMNI VIDEO (kling-video-o1) =================
      if (model === KlingAI.options.omni_video.model.o1) {
        const image_list = [];

        if (this.srcImage) {
          image_list.push({
            image_url: (await this.srcImage.getBase64()).rawBase64,
            type: KlingAI.options.omni_video.image.type.first_frame,
          });
        }

        if (this.end_frame) {
          image_list.push({
            image_url: (await this.end_frame.getBase64()).rawBase64,
            type: KlingAI.options.omni_video.image.type.end_frame,
          });
        }

        task_info = await KlingAI.omniVideo({
          prompt,
          model: "kling-video-o1",
          mode: workflow.mode ?? "pro",
          duration: workflow.duration ?? "5",
          aspect_ratio: "16:9", // required unless editing video
          image_list: image_list.length ? image_list : undefined,
        });
      }

      // ================= IMG2VIDEO (default Kling models) =================
      else if (this.srcImage) {
        const img_raw = (await this.srcImage.getBase64()).rawBase64;
        const img_tail_raw = (await this.end_frame?.getBase64())?.rawBase64;

        task_info = await KlingAI.img2video({
          image: img_raw,
          image_tail: img_tail_raw,
          prompt,
          model,
          mode: workflow.mode,
          duration: workflow.duration,
          sound: workflow?.sound ?? KlingAI.options.img2video.sound.off
        });
      }

      if (!task_info) return;

      const task = this.addTask(task_info.id, {
        provider: ai_providers.KLING,
        workflow: task_info.workflow,
        // Add Gen Info
        geninfo: {
          workflow: "kling_generate_video",
          prompt: prompt,
          model: model,
          source: this.srcImage?.path,
          end_frame: this.end_frame?.path,
          kling: {
            mode: workflow.mode,
            duration: workflow.duration,
            sound: workflow?.sound ?? KlingAI.options.img2video.sound.off
          }
        }
      });

      await new Promise(res => setTimeout(res, 100));
      task.check_status();

    } catch (err) {
      console.error("Submitting Video Generation Failed:", err);
    } finally {
      runInAction(() => {
        this.is_submitting_video = false;
      });
    }
  }

  async Kling_IdentyfiFace() {
    runInAction(() => { this.is_submitting_video = true; });
    try {
      console.log("Identyfying Video Face");
      if (this.outVideo) {
        const video_url = await this.outVideo.getWebUrl();
        const res = await KlingAI.identifyFace({ video_url });
        console.log("FACE ID res:", res);

        if (res.message == "SUCCEED") {
          this.shotJson?.updateField("KlingFaceID/" + this.outVideo.name, res.data);
        }

      }
    } catch (err) {
      console.error("Face Identification Failed:", err);
    } finally {
      runInAction(() => { this.is_submitting_video = false; });
    }
  }

  async Kling_LypSync() {
    runInAction(() => { this.is_submitting_video = true; });
    try {
      const face_choose: LipSyncFaceChoose[] = [];

      // Loop sequentially to await async calls
      for (const tag of ["ID-0", "ID-1", "ID-2"]) {
        const audio = this.MediaFolder_Audio!.getFirstMediaWithTag(tag) as LocalAudio | null;
        if (!audio) continue;

        const objectUrl = await audio.getBase64(); // or await audio.getBase64()
        if (!objectUrl) continue;

        const duration = await audio.getDuration(); // replace with actual audio duration if available

        face_choose.push({
          face_id: tag.replace("ID-", ""),           // adjust if face_id differs
          sound_file_path: audio.path,
          sound_file: objectUrl.rawBase64,
          sound_start_time: 0,
          sound_end_time: Math.min(duration * 1000, 5000),
          sound_insert_time: 0,
          sound_volume: 1,
          original_audio_volume: 1,
        });
      }

      if (face_choose.length === 0) {
        console.warn("No audios found for lip-sync.");
        return;
      }

      const task_info = await KlingAI.lipSync({
        session_id: this.kling_face_id_data.session_id,
        face_choose
      });

      const task = this.addTask(task_info.id, {
        provider: ai_providers.KLING,
        workflow: task_info.workflow,
        geninfo: {
          workflow: "kling_LipSync",
          source: this.outVideo?.path,
          face_choose: face_choose.map(obj => ({ ...obj, sound_file: "" }))
        }
      });
      await new Promise(res => setTimeout(res, 100));
      task.check_status();

      await new Promise(res => setTimeout(res, 2000));

    } catch (err) {
      console.error("Submitting Lip Sync Failed:", err);
    } finally {
      runInAction(() => { this.is_submitting_video = false; });
    }
  }

  async GenerateVideo_KlingMotionControl() {
    runInAction(() => { this.is_submitting_video = true; });
    let prompt = this.shotJson?.data.video_prompt || "";
    try {
      const workflow = this.scene.project.workflows.kling_motion_control;

      // Generate if we have src image
      if (this.srcImage && this.kling_motion_video) {
        const img_raw = (await this.srcImage.getBase64()).rawBase64;
        const video_url = await this.kling_motion_video.getWebUrl();

        const task_info = await KlingAI.motionControl({
          image: img_raw,
          video_url,
          prompt,
          mode: workflow.mode,
          character_orientation: workflow.character_orientation,
          keep_original_sound: workflow.keep_original_sound,
        });

        const task = this.addTask(task_info.id, {
          provider: ai_providers.KLING,
          workflow: task_info.workflow,
          // GENINFO
          geninfo: {
            workflow: "kling_MotionControl",
            prompt: prompt,
            source: this.srcImage?.path,
            motionVideo: this.kling_motion_video.path,
            kling: {
              mode: workflow.mode,
              duration: workflow.duration,
              character_orientation: workflow.character_orientation,
              keep_original_sound: workflow.keep_original_sound,
            }
          }
        })
        await new Promise(res => setTimeout(res, 100));
        task.check_status();

        await new Promise(res => setTimeout(res, 2000));
      }

    } catch (err) {
      console.error("Submitting Video Generation Failed:", err);
    } finally {
      runInAction(() => { this.is_submitting_video = false; });
    }
  }

  getFilteredTags() {
    return this.scene.getTags().filter(tag =>
      !this.getSkippedTags().includes(tag.path)
    );
  }

  async getImageTags(): Promise<AIImageInput[]> {
    const skipped = this.getSkippedTags();
    const images: AIImageInput[] = [];

    for (const art of this.scene.getTags()) {
      if (skipped.includes(art.path)) continue;

      try {
        const base64Obj = await art.image.getBase64();
        images.push({
          rawBase64: base64Obj.rawBase64,
          mime: base64Obj.mime,
          description: art.path,
        });
      } catch (err) {
        console.warn("Failed to load tag image:", art.path, err);
      }
    }

    return images;
  }

  async GenerateImage() {
    runInAction(() => { this.is_generating = true; });

    try {
      const images = await this.getImageTags();
      const prompt = this.shotJson?.data.prompt || "";

      const result = await GoogleAI.img2img(
        prompt,
        this.scene.project.workflows.generate_shot_image.model,
        images
      );

      const localImage: LocalImage | null =
        await GoogleAI.saveResultImage(
          result,
          this.MediaFolder_results as LocalFolder
        );

      if (localImage) {
        const generatedImage = await this.MediaFolder_results?.addMediaItem(localImage);

        // Save Generation Info
        generatedImage?.mediaJson?.updateField("geninfo", {
          workflow: "shot_generate_image",
          prompt: prompt,
          model: this.scene.project.workflows.generate_shot_image.model,
          art_refs: this.getFilteredTags().map(tag => tag.path),
        })

      }
    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      runInAction(() => { this.is_generating = false; });
    }
  }

  async StylizeImage() {
    if (!this.unreal_frame) { console.error("No Reference Frame"); return; }

    runInAction(() => { this.is_generating = true; });

    try {
      const images: AIImageInput[] = [];

      // Base image first
      const base64Obj = await this.unreal_frame.getBase64();
      images.push({
        rawBase64: base64Obj.rawBase64,
        mime: base64Obj.mime,
        description: "Base Image",
      });

      // Tag images
      images.push(...await this.getImageTags());

      const prompt =
        (this.scene.project.workflows.stylize_image_google.prompt || "") +
        (this.shotJson?.data.stylize_prompt || "");

      const result = await GoogleAI.img2img(
        prompt,
        this.scene.project.workflows.stylize_image_google.model,
        images
      );

      const localImage: LocalImage | null =
        await GoogleAI.saveResultImage(
          result,
          this.MediaFolder_results as LocalFolder
        );

      if (localImage) {
        const loadedLocalImage = await this.MediaFolder_results?.addMediaItem(localImage);

        // Save Generation Info
        loadedLocalImage?.mediaJson?.updateField("geninfo", {
          workflow: "stylize_image_google",
          global_prompt: this.scene.project.workflows.stylize_image_google.prompt || "",
          prompt: this.shotJson?.data.stylize_prompt || "",
          model: this.scene.project.workflows.stylize_image_google.model,
          art_refs: this.getFilteredTags().map(tag => tag.path),
          source: this.unreal_frame.path,
        })

      }
    } catch (err) {
      console.error("StylizeImage failed:", err);
    } finally {
      runInAction(() => {
        this.is_generating = false;
      });
    }
  }

  /*
  // Probably can delete this part??
  async saveGoogleResultImage(result: any, select: boolean = false) {
    const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, this.MediaFolder_results?.folder as FileSystemDirectoryHandle);
    if (localImage) {
      const media_item = await this.MediaFolder_results!.loadFile(localImage.handle);
      await media_item?.load()
      if (select) this.MediaFolder_results?.setSelectedMedia(media_item);
    }
  }*/

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

  log() { console.log(toJS(this)); }

  


}
