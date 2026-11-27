
import { getFromWorker, postToWorker } from "../CloudflareWorker/WorkerUtils";

export type MediaKitScene =
    | "aigc"
    | "short_series"
    | "ugc"
    | "old_film";

export type MediaKitEnhanceOptions = {
    video_url: string;
    scene?: MediaKitScene;
    resolution?: string;
    tool_version?: "standard" | "pro";
    enhance_style?: string;
};

export type MediaKitTask = {
    task_id: string;
    request_id?: string;
    status?: string;
    provider?: "MediaKit";
    [key: string]: any;
};

export class MediaKitAI {
    /**
     * Submit a video enhancement task to your Worker.
     * video_url must be publicly accessible by MediaKit.
     */
    public static async enhanceVideo(
        options: MediaKitEnhanceOptions
    ): Promise<MediaKitTask> {
        if (!options.video_url) {
            throw new Error("video_url is required");
        }

        const payload = {
            scene: "aigc" as MediaKitScene,
            resolution: "1080p",
            tool_version: "standard" as const,
            enhance_style: "clear",
            ...options,
        };

        const data = await postToWorker(
            payload,
            "mediakit/enhance",
            {
                scene: payload.scene,
                resolution: payload.resolution,
                tool_version: payload.tool_version,
            }
        );

        if (!data?.task_id) {
            throw new Error(
                data?.error ?? "MediaKit did not return a task ID"
            );
        }

        return data as MediaKitTask;
    }

    /**
     * Fetch the current task status from your Worker.
     *
     * Implement getFromWorker as a GET equivalent of postToWorker,
     * so it uses the same Worker URL and authentication.
     */
    public static async getTaskStatus(
        taskId: string
    ): Promise<MediaKitTask> {
        const data = await getFromWorker(
            `mediakit/status/${encodeURIComponent(taskId)}`
        );

        return data as MediaKitTask;
    }

    /**
     * Optional convenience method: poll until completed or failed.
     */
    public static async waitForCompletion(
        taskId: string,
        options: {
            intervalMs?: number;
            timeoutMs?: number;
            onUpdate?: (task: MediaKitTask) => void;
        } = {}
    ): Promise<MediaKitTask> {
        const intervalMs = options.intervalMs ?? 5000;
        const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000;
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            const task = await this.getTaskStatus(taskId);

            options.onUpdate?.(task);

            if (
                task.status === "completed" ||
                task.status === "succeeded"
            ) {
                return task;
            }

            if (task.status === "failed") {
                throw new Error(
                    task.error
                        ? JSON.stringify(task.error)
                        : "MediaKit enhancement failed"
                );
            }

            await new Promise(resolve =>
                setTimeout(resolve, intervalMs)
            );
        }

        throw new Error("Timed out waiting for MediaKit enhancement");
    }
}
