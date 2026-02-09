// Shot.ts
import { Scene } from './Scene';
import { LocalJson } from './LocalJson';
import { LocalImage } from './LocalImage';
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { GoogleAI } from './GoogleAI';
import { KlingAI, type LipSyncFaceChoose } from './KlingAI';
import { Task } from './Task';
//import { Art } from "./Art";
import { ai_providers } from './AI_providers';
import { LocalVideo } from './LocalVideo';
import { MediaFolder } from './MediaFolder';
import type { LocalAudio } from './LocalAudio';



export class Shot {
  folder: FileSystemDirectoryHandle;
  path: string = "";
  scene: Scene;
  shotJson: LocalJson | null = null;
  tasks: Task[] = [];

  // Processes
  is_submitting_video = false;
  is_generating = false;

  // MediaFolders
  MediaFolder_results: MediaFolder | null = null;
  MediaFolder_genVideo: MediaFolder | null = null;
  MediaFolder_refVideo: MediaFolder | null = null;
  MediaFolder_Audio: MediaFolder | null = null;

  constructor(folder: FileSystemDirectoryHandle, scene: Scene) {
    this.folder = folder;
    this.scene = scene;
    this.path = scene.path + "/" + folder.name;
    makeAutoObservable(this);
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
      this.shotJson = await LocalJson.create(this.folder, 'shotinfo.json');

      // Load Media Folders
      this.MediaFolder_results = new MediaFolder(this.folder, "results", this.path, this.shotJson, this);
      this.MediaFolder_results.tags = ["start_frame", "end_frame", "ref_frame", "unreal_frame"];
      await this.MediaFolder_results.load();


      this.MediaFolder_genVideo = new MediaFolder(this.folder, "genVideo", this.path, this.shotJson, this);
      this.MediaFolder_genVideo.tags = ["picked"];
      await this.MediaFolder_genVideo.load();


      this.MediaFolder_refVideo = new MediaFolder(this.folder, "refVideo", this.path, this.shotJson, this);
      this.MediaFolder_refVideo.tags = ["motion_ref"];
      await this.MediaFolder_refVideo.load();

      this.MediaFolder_Audio = new MediaFolder(this.folder, "audio", this.path, this.shotJson, this);
      this.MediaFolder_Audio.tags = ["ID-0", "ID-1", "ID-2"];
      await this.MediaFolder_Audio.load();


      // Load Tasks      
      this.loadTasks();

    } catch (err) {
      console.error('Error loading shot:', this.folder.name, err);
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
    runInAction(() => {
      this.tasks.push(task);
    });
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

        const duration = 5000; // replace with actual audio duration if available

        face_choose.push({
          face_id: tag.replace("ID-",""),           // adjust if face_id differs
          sound_file: objectUrl.rawBase64,
          sound_start_time: 0,
          sound_end_time: duration,
          sound_insert_time: 0,
          sound_volume: 1,
          original_audio_volume: 1,
        });
      }

      if (face_choose.length === 0) {
        console.warn("No audios found for lip-sync!");
        return;
      }

      const task_info = await KlingAI.lipSync({
        session_id: this.kling_face_id_data.session_id,
        face_choose
      });

      const task = this.addTask(task_info.id, { provider: ai_providers.KLING, workflow: task_info.workflow });
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

        const task = this.addTask(task_info.id, { provider: ai_providers.KLING, workflow: task_info.workflow })
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

  async GenerateImage() {
    runInAction(() => {
      this.is_generating = true; // start generating
    });

    // add input images, skipping any skipped tags
    const skipped = this.getSkippedTags();
    const images: { rawBase64: string; mime: string; description: string }[] = [];

    //const image_paths = [];
    for (const art of this.scene.getTags()) {
      if (skipped.includes(art.path)) continue; // skip this tag

      try {
        const base64Obj = await art.image.getBase64(); // uses cached Base64 if available
        //images.push(base64Obj);
        images.push({ rawBase64: base64Obj.rawBase64, mime: base64Obj.mime, description: art.path });

        //image_paths.push(art.path);
      } catch (err) {
        console.warn("Failed to load tag image:", art.path, err);
      }
    }

    let prompt = this.shotJson?.data.prompt || "";
    //if (image_paths.length > 0) { prompt += `\n\nИспользуй эти картинки как референсы:\n${image_paths.join("\n")}`; }

    try {
      const result = await GoogleAI.img2img(prompt || "", this.scene.project.workflows.generate_shot_image.model, images);
      const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, this.MediaFolder_results?.folder as FileSystemDirectoryHandle);
      if (localImage) this.MediaFolder_results?.loadFile(localImage.handle);
    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      runInAction(() => {
        this.is_generating = false; // start generating
      });
    }
  }

  async StylizeImage() {
    if (!this.unreal_frame) {
      console.error("No Reference Frame");
      return;
    }

    runInAction(() => { this.is_generating = true; });

    // add input images, skipping any skipped tags
    const skipped = this.getSkippedTags();
    const images: { rawBase64: string; mime: string; description: string }[] = [];

    // Add Reference image
    const base64Obj = await this.unreal_frame.getBase64(); // uses cached Base64 if available
    images.push({ rawBase64: base64Obj.rawBase64, mime: base64Obj.mime, description: "Base Image" });

    for (const art of this.scene.getTags()) {
      if (skipped.includes(art.path)) continue; // skip this tag
      try {
        const base64Obj = await art.image.getBase64(); // uses cached Base64 if available
        images.push({ rawBase64: base64Obj.rawBase64, mime: base64Obj.mime, description: art.path });
      } catch (err) {
        console.warn("Failed to load tag image:", art.path, err);
      }
    }
    let prompt = (this.scene.project.workflows.stylize_image_google.prompt || "") + (this.shotJson?.data.stylize_prompt || "");

    try {
      const result = await GoogleAI.img2img(prompt || "", this.scene.project.workflows.stylize_image_google.model, images);
      const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, this.MediaFolder_results?.folder as FileSystemDirectoryHandle);
      if (localImage) this.MediaFolder_results?.loadFile(localImage.handle);
    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      runInAction(() => {
        this.is_generating = false; // start generating
      });
    }
  }



  async saveGoogleResultImage(result: any, select: boolean = false) {
    const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, this.MediaFolder_results?.folder as FileSystemDirectoryHandle);
    if (localImage) {
      const media_item = this.MediaFolder_results!.loadFile(localImage.handle);
      if (select) this.MediaFolder_results?.setSelectedMedia(media_item);
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

  log() { console.log(toJS(this)); }

}
