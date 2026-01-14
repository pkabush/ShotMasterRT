// Task.ts
import { makeAutoObservable, toJS,runInAction } from "mobx";
import { Shot } from "./Shot";
import { ai_providers } from "./AI_providers";
import { KlingAI } from "./KlingAI";
import { LocalVideo } from "./LocalVideo";




export class Task {
    shot: Shot;
    id: string;
    is_checking_status = false;
    _status_log: string = "";

    constructor(
        shot: Shot,
        id: string,
    ) {
        this.shot = shot;
        this.id = id;

        makeAutoObservable(this);
    }

    update(newData: any) {
        const currentData = this.data || {};
        const mergedData = { ...currentData, ...newData };
        this.shot.shotJson?.updateField(`tasks/${this.id}`, mergedData);
    }

    log() {
        console.log({ task: toJS(this), data: toJS(this.data) });
    }

    delete() {
        this.shot.removeTask(this);
    }

    get data() {
        return this.shot.shotJson?.getField(`tasks/${this.id}`);
    }

    finish_checking(){
        runInAction(() => { this.is_checking_status = false; });
        this._status_log = "";
    }

    async check_status(retries: number = 30, delayMs: number = 5000) {
        if (this.data.provider !== ai_providers.KLING) return;

        runInAction(() => { this.is_checking_status = true; });

        for (let attempt = 0; attempt <= retries; attempt++) {
            const status = await KlingAI.getStatus(this.id, this.data.workflow);
            this.update(status);

            if (status?.status === "succeed" && status.url) {
                await this.downloadResults();
                this.finish_checking();
                return;
            }

            if (status?.status === "failed") {
                console.warn(`Task ${this.id} failed.`);
                this.finish_checking();
                return;
            }

            if (attempt < retries) {
                console.log(`Task ${this.id} not finished. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${retries})`);
                // Update Status
                runInAction(() => { this._status_log = `(attempt ${attempt + 1}/${retries})`; })                
                await new Promise(res => setTimeout(res, delayMs));
            }
        }


        console.warn(`Task ${this.id} did not finish after ${retries} retries.`);
        this.finish_checking();
    }

    async downloadResults(): Promise<LocalVideo | null> {
        const url = this.data?.url;
        const folder = this.shot.genVideoFolder; // make sure this exists
        if (!url) {
            console.warn("No URL found to download.");
            return null;
        }
        if (!folder) {
            console.warn("No results folder available to save file.");
            return null;
        }

        try {
            // Use LocalVideo's static factory
            const localVideo = await LocalVideo.fromUrl(url, folder);

            console.log(`Downloaded result video: ${localVideo.handle.name}`);
            runInAction(() => { this.shot.videos.push(localVideo); });            
            return localVideo;
        } catch (err) {
            console.error("Failed to download Kling task result:", err);
            return null;
        }
    }

}