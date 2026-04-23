// Task.ts
import { makeAutoObservable, toJS, runInAction } from "mobx";
import { Shot } from "./Shot";
import { ai_providers } from "./AI_provider";
import { KlingAI } from "./KlingAI";
import { notificationManager } from "./NotificationManager";
import type { LocalMedia } from "./fileSystem/LocalMedia";
import { SeedanceAI } from "./AiProviders/Byteplus";

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
        const res_media = await this.shot.MediaFolder_genVideo?.downloadFromUrl(url, this.data?.task_name) as LocalMedia;

        if (!res_media) return;

        // Save Res Media GenINFO
        if (this.data.geninfo) res_media?.mediaJson?.updateField("geninfo", this.data.geninfo)

        this.update({ result: res_media?.name });

        notificationManager.add(`Downloaded ${this.shot.path}`, notificationManager.types.success, {
            onClick: () => { this.navigate(); },
            media: res_media,
        })
    }

    navigate() {
        this.shot.scene.selectShot(this.shot);
        this.shot.scene.project.setScene(this.shot.scene);
    }

    get result(): LocalMedia | null {
        return this.shot.MediaFolder_genVideo!.getMediaByFilename(this.data.result);
    }

}