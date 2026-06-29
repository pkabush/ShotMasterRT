//// Task.ts
import { makeAutoObservable, toJS, runInAction, makeObservable, observable, computed } from "mobx";
import { getCurrentTimestampUTC, Shot } from "./Shot";
import { ai_providers } from "./AI_provider";
import { KlingAI } from "./KlingAI";
import { notificationManager } from "./NotificationManager";
import type { LocalMedia } from "./fileSystem/LocalMedia";
import { SeedanceAI } from "./AiProviders/Byteplus";
import type { LocalJson } from "./LocalJson";



export class TasksJson {
    //tasks: Task[] = [];
    dataJson: LocalJson | null = null;

    constructor(dataJson: LocalJson) {
        this.dataJson = dataJson;
        makeObservable(this, {
            dataJson: observable,           // observable reference to the LocalJson
            tasks: computed,                 // computed getter/setter
        });
    }

    /*
    loadTasks(): void {
        const tasksData = this.dataJson?.getField("tasks");
        runInAction(() => {
            this.tasks = [];
            if (!tasksData || typeof tasksData !== "object") return;
            for (const taskId of Object.keys(tasksData)) {
                this.tasks.push(new Task(this, taskId));
            }
        });
    }
    */

    get tasks(): Task[] {
        const tasksData = this.dataJson?.getField("tasks");
        if (!tasksData || typeof tasksData !== "object") {
            return [];
        }
        return Object.keys(tasksData).map(
            taskId => new Task(this, taskId)
        );
    }

    set tasks(tasks: Task[]) {
        const tasksData: Record<string, any> = {};
        for (const task of tasks) {
            tasksData[task.id] = this.dataJson?.getField(`tasks.${task.id}`) ?? {};
        }
        this.dataJson?.updateField("tasks", tasksData);
    }


    addTask(id: string, data?: any | null): Task {
        const task = new Task(this, id);
        data.task_name = `${task.tasksJson.dataJson?.parentFolder!.path!.replaceAll("/", "_")}_${getCurrentTimestampUTC()}${data.geninfo?.workflow ? `_${data.geninfo.workflow}` : ''}`;
        runInAction(() => { this.tasks.push(task); });
        task.update(data);
        return task;
    }

    removeTask(task: Task) {
        runInAction(() => {
            this.tasks = this.tasks.filter(t => t !== task);
        });

        const tasks = this.dataJson?.getField("tasks") ?? {};
        delete tasks[task.id as string];
        this.dataJson?.updateField("tasks", tasks);
    }

    get outFolder() {
        const parent_folder = this.dataJson?.parentFolder;
        if (parent_folder instanceof Shot)
            return parent_folder.MediaFolder_genVideo;

        return parent_folder;
    }

    get shot() {
        const parent_folder = this.dataJson?.parentFolder;
        if (parent_folder instanceof Shot) return parent_folder;
        return null;
    }
}




export class Task {
    tasksJson: TasksJson;
    id: string;
    is_checking_status = false;
    _status_log: string = "";
    shot: Shot | null = null;

    constructor(
        tasksJson: TasksJson,
        id: string,
    ) {
        this.tasksJson = tasksJson;
        this.id = id;

        makeAutoObservable(this);
    }

    update(newData: any) {
        const currentData = this.data || {};
        const mergedData = { ...currentData, ...newData };
        this.tasksJson.dataJson?.updateField(`tasks/${this.id}`, mergedData);
    }

    log() {
        console.log("LOG TASK");
        console.log({ task: toJS(this), data: toJS(this.data) });
    }

    delete() {
        this.tasksJson.removeTask(this);
    }

    get data() {
        return this.tasksJson.dataJson?.getField(`tasks/${this.id}`);
    }

    get status() {
        return this.data.status ?? "submitted";
    }

    finish_checking() {
        runInAction(() => { this.is_checking_status = false; });
        this._status_log = "";
    }

    async check_status(retries: number = 30, delayMs: number = 15000) {
        if (![ai_providers.KLING, ai_providers.BD].includes(this.data.provider)) return;

        runInAction(() => { this.is_checking_status = true; this._status_log = "start checking"; });

        console.log("started checking status");

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log("new attempt");

                // KLING
                if (this.data.provider == ai_providers.KLING) {
                    const status = await KlingAI.getStatus(this.id, this.data.workflow);

                    console.log("status", status)
                    this.update(status);

                    if ((status?.status === "succeed" || status?.status === "succeeded") && status.url) {
                        await this.downloadResults();
                        this.finish_checking();
                        return;
                    }

                    if (status?.status === "failed") {
                        console.warn(`Task ${this.id} failed.`);
                        this.finish_checking();
                        return;
                    }
                }

                console.log(this.data.provider);
                // Bytedance
                if (this.data.provider == ai_providers.BD) {
                    console.log("Check Bytedance Status");
                    const status = await SeedanceAI.getStatus(this.id);

                    console.log("status", status)
                    this.update(status);

                    if (status?.status === "succeeded" && status.url) {
                        await this.downloadResults();
                        this.finish_checking();
                        return;
                    }

                    if (["failed", "expired", "cancelled"].includes(status?.status)) {
                        console.warn(`Task ${this.id} failed.`);
                        this.finish_checking();
                        return;
                    }

                }


            } catch (err) {
                console.error("Status check failed:", err);
            }

            if (attempt < retries) {
                runInAction(() => {
                    this._status_log = `(attempt ${attempt + 1}/${retries})`;
                });

                await new Promise(res => setTimeout(res, delayMs));
            }
        }


        console.warn(`Task ${this.id} did not finish after ${retries} retries.`);
        this.finish_checking();
    }

    async downloadResults() {
        const url = this.data?.url;
        const res_media = await this.tasksJson.outFolder!.downloadFromUrl(url, this.data?.task_name) as LocalMedia;

        if (!res_media) return;

        // Save Res Media GenINFO
        if (this.data.geninfo) res_media?.mediaJson?.updateField("geninfo", this.data.geninfo)

        this.update({ result: res_media?.name });

        notificationManager.add(`Downloaded ${res_media.name}`, notificationManager.types.success, {
            onClick: () => { this.navigate(); },
            media: res_media,
        })
    }

    navigate() {
        if (this.tasksJson.shot) {
            this.tasksJson.shot.scene.selectShot(this.tasksJson.shot);
            this.tasksJson.shot.scene.project.setScene(this.tasksJson.shot.scene);
        }
    }

    get result(): LocalMedia | null {
        return this.tasksJson.outFolder!.children.find(m => m.name === this.data.result) as LocalMedia ?? null;
    }

}