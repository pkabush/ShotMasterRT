// Shot.ts
import { Scene } from './Scene';
import { LocalJson } from './LocalJson';
import { LocalImage } from './LocalImage';
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { GoogleAI } from './GoogleAI';
import { KlingAI } from './KlingAI';
import { Task } from './Task';
//import { Art } from "./Art";
import { ai_providers } from './AI_providers';
import { LocalVideo } from './LocalVideo';




export class Shot {
  folder: FileSystemDirectoryHandle;
  scene: Scene;
  shotJson: LocalJson | null = null;
  images: LocalImage[] = [];
  videos: LocalVideo[] = [];
  ref_videos: LocalVideo[] = [];
  srcImage: LocalImage | null = null;
  resultsFolder: FileSystemDirectoryHandle | null = null; // <--- store results folder
  genVideoFolder: FileSystemDirectoryHandle | null = null; // <--- store results folder
  refVideoFolder: FileSystemDirectoryHandle | null = null; // <--- store results folder
  is_generating = false;
  selected_art: LocalImage | null = null;
  tasks: Task[] = [];
  is_submitting_video = false;
  // Kling
  kling_motion_video: LocalVideo | null = null;

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
            const localImage = new LocalImage(handle as FileSystemFileHandle, this.resultsFolder);
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

      // Read Video Folder
      try {
        this.genVideoFolder = await this.folder.getDirectoryHandle('genVideo', { create: true });

        for await (const [, handle] of this.genVideoFolder.entries()) {
          if (handle.kind === 'file') {
            const localVideo = new LocalVideo(handle as FileSystemFileHandle, this.genVideoFolder);
            this.videos.push(localVideo);
          }
        }
      } catch (err) {
        console.warn('No genVideo folder found or failed to read:', err);
        this.genVideoFolder = null;
      }


      // Read Video References Folder
      try {
        this.refVideoFolder = await this.folder.getDirectoryHandle('refVideo', { create: true });

        for await (const [name, handle] of this.refVideoFolder.entries()) {
          if (handle.kind === 'file') {
            const localVideo = new LocalVideo(handle as FileSystemFileHandle, this.refVideoFolder);
            this.ref_videos.push(localVideo);

            if (this.shotJson.data?.kling_motion_video && name === this.shotJson.data.kling_motion_video) {
              this.kling_motion_video = localVideo;
            }
          }
        }
      } catch (err) {
        console.warn('No genVideo folder found or failed to read:', err);
        this.genVideoFolder = null;
      }

      // Load Tasks      
      this.loadTasks();

    } catch (err) {
      console.error('Error loading shot:', this.folder.name, err);
      this.shotJson = null;
      this.images = [];
      this.srcImage = null;
      this.resultsFolder = null;
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
    if (!this.srcImage) { this.setSrcImage(image); }
  }


  removeImage(image: LocalImage) {
    // Remove from array
    this.images = this.images.filter(i => i !== image);

    // If it was the source image, clear it
    if (this.srcImage === image) {
      this.setSrcImage(null);
    }
  }

  removeVideo(video: LocalVideo) {
    // Remove from array
    this.videos = this.videos.filter(i => i !== video);
    // If it was the source video, clear it
  }

  removeReferenceVideo(video: LocalVideo) {
    this.ref_videos = this.ref_videos.filter(i => i !== video);
  }

  setKlingMotionReferenceVideo( video: LocalVideo)
  {
    this.kling_motion_video = video;
    this.shotJson?.updateField("kling_motion_video",video.handle.name)
  }

  async GenerateVideo() {
    runInAction(() => {
      this.is_submitting_video = true;
    });

    let prompt = this.shotJson?.data.video_prompt || "";

    try {
      const workflow = this.scene.project.workflows.generate_video_kling;

      // Generate if we have src image
      if (this.srcImage) {
        const img_raw = (await this.srcImage.getBase64()).rawBase64;
        const task_info = await KlingAI.img2video({
          image: img_raw,
          prompt,
          model: workflow.model,
          mode: workflow.mode,
          duration: workflow.duration,
        });

        const task = this.addTask(task_info.id, { provider: ai_providers.KLING, workflow: task_info.workflow })
        await new Promise(res => setTimeout(res, 100));
        console.log("created_task");

        task.check_status();
      }

      //const task_info = await KlingAI.txt2video(prompt); 
      //


    } catch (err) {
      console.error("Submitting Video Generation Failed:", err);
    } finally {
      runInAction(() => {
        this.is_submitting_video = false;
      });
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
      const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, this.resultsFolder as FileSystemDirectoryHandle);
      if (localImage) this.addImage(localImage);
    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      runInAction(() => {
        this.is_generating = false; // start generating
      });
    }
  }

  selectArt(art: LocalImage | null = null) {
    runInAction(() => { this.selected_art = art; });
  }

  async saveGoogleResultImage(result: any, select: boolean = false) {
    const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, this.resultsFolder as FileSystemDirectoryHandle);
    if (localImage) {
      this.addImage(localImage);
      if (select) this.selectArt(localImage);
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
