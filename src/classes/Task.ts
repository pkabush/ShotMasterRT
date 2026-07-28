//// Task.ts
import { makeAutoObservable, toJS, runInAction, makeObservable, observable, computed } from "mobx";
import { getCurrentTimestampUTC, Shot } from "./Shot";
import { notificationManager } from "./NotificationManager";
import type { LocalMedia } from "./fileSystem/LocalMedia";
import type { LocalJson } from "./LocalJson";
import { useGoogleStore, WORKER_URL } from "../contexts/GoogleUserContext";



export class TasksJson {
    static registry = new Map<string, TasksJson>();

    //tasks: Task[] = [];
    dataJson: LocalJson | null = null;

    constructor(dataJson: LocalJson) {
        this.dataJson = dataJson;
        makeObservable(this, {
            dataJson: observable,           // observable reference to the LocalJson
            tasks: computed,                 // computed getter/setter
        });

        // Replace existing instance for this path
        TasksJson.registry.set(dataJson.path, this);
        console.log("Registered TASKS Json", dataJson.path);
    }

    static getAllTasksJsons(): TasksJson[] {
        return [...TasksJson.registry.values()];
    }

    static getTaskById(taskId: string): Task | undefined {
        for (const tasksJson of this.registry.values()) {
            const task = tasksJson.tasks.find(t => t.id === taskId);
            if (task) return task;
        }
        return undefined;
    }

    get tasks(): Task[] {
        const tasksData = this.dataJson?.getField("tasks");
        if (!tasksData || typeof tasksData !== "object") {
            return [];
        }
        return Object.keys(tasksData).map(
            taskId => new Task(this, taskId)
        );
    }

    // Setter makes no sense here - replace it with delete task and add task with direct acess to dataJson
    set tasks(tasks: Task[]) {
        const tasksData: Record<string, any> = {};
        for (const task of tasks) {
            tasksData[task.id] = this.dataJson?.getField(`tasks/${task.id}`) ?? {};
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
        runInAction(() => { this.tasks = this.tasks.filter(t => t !== task); });
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
        console.log("LOG TASK", { task: toJS(this), data: toJS(this.data) });
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

    async check_status() {
        console.log("CHECK STATUS", this);

        const targetUrl = `${WORKER_URL}/seedance/status/${this.id}`;
        const idToken = useGoogleStore.getState().idToken;
        if (!idToken) { throw new Error("Not logged in"); }

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Seedance status request failed: ${errorText}`);
        }

        console.log("Seedance check status:", await response.text());
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


