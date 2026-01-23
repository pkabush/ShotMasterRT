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
import { MediaFolder } from './MediaFolder';



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

  constructor(folder: FileSystemDirectoryHandle, scene: Scene) {
    this.folder = folder;
    this.scene = scene;
    this.path = scene.path + "/" + folder.name;
    makeAutoObservable(this);
  }

  // GETTERS FOR CONVINIENCE
  get srcImage(): LocalImage | null {
    return this.MediaFolder_results!.getNamedMedia("start_frame") as LocalImage;    
  }
  get end_frame(): LocalImage | null {
    return this.MediaFolder_results!.getNamedMedia("end_frame") as LocalImage;    
  }
  get kling_motion_video(): LocalVideo | null {
      return this.MediaFolder_refVideo!.getNamedMedia("motion_ref") as LocalVideo;    
  }
  get outVideo(): LocalVideo | null {
      return this.MediaFolder_genVideo!.getNamedMedia("picked") as LocalVideo;    
  }




  async load(): Promise<void> {
    try {
      this.shotJson = await LocalJson.create(this.folder, 'shotinfo.json');

      // Load Media Folders
      this.MediaFolder_results = new MediaFolder(this.folder, "results", this.path,this.shotJson);
      this.MediaFolder_results.tags = ["start_frame","end_frame"];
      await this.MediaFolder_results.load();   


      this.MediaFolder_genVideo = new MediaFolder(this.folder, "genVideo", this.path,this.shotJson);
      this.MediaFolder_genVideo.tags = ["picked"];
      await this.MediaFolder_genVideo.load();


      this.MediaFolder_refVideo = new MediaFolder(this.folder, "refVideo", this.path,this.shotJson);
      this.MediaFolder_refVideo.tags = ["motion_ref"];
      await this.MediaFolder_refVideo.load();

      


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

    let prompt = this.shotJson?.data.video_prompt || "";

    try {
      const workflow = this.scene.project.workflows.generate_video_kling;

      // Generate if we have src image
      if (this.srcImage) {
        const img_raw = (await this.srcImage.getBase64()).rawBase64;
        const img_tail_raw = (await this.end_frame?.getBase64())?.rawBase64;

        const task_info = await KlingAI.img2video({
          image: img_raw,
          image_tail: img_tail_raw,
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
      if (select) this.MediaFolder_results?.setNamedMedia("selected",media_item )
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
