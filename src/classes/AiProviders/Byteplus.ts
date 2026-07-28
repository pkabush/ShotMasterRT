import { postToWorker } from "../CloudflareWorker/WorkerUtils";

export type SeedanceContent =
    | {
        type: "text";
        text: string;
    }
    | {
        type: "image_url";
        image_url: {
            url: string;
        };
        role?: "reference_image" | "first_frame" | "last_frame";
    };



export class SeedanceAI {
    public static options = {
        video: {
            generate_audio: {
                on: true,
                off: false,
            },
            resolution: {
                default: "",
                "480p": "480p",
                "720p": "720p",
                "1080p": "1080p",
                "4k": "4k",
            },
            ration: {
                "adaptive": "adaptive",
                "16:9": "16:9",
                "4:3": "4:3",
                "1:1": "1:1",
                "3:4": "3:4",
                "9:16": "9:16",
                "21:9": "21:9",
            },
            duration: {
                "default": "",
                "4": "4",
                "5": "5",
                "6": "6",
                "7": "7",
                "8": "8",
                "9": "9",
                "10": "10",
                "11": "11",
                "12": "12",
                "13": "13",
                "14": "14",
                "15": "15",
            }

        }
    }

    public static textMsg(text: string): SeedanceContent {
        if (!text) throw new Error("textMsg requires text");
        return {
            type: "text",
            text,
        };
    }

    public static imgMsg(
        url: string,
        role: "reference_image" | "first_frame" | "last_frame" | undefined = "reference_image"
    ): SeedanceContent {
        if (!url) throw new Error("imgMsg requires a url");
        return {
            type: "image_url",
            image_url: { url },
            ...(role ? { role } : {}),
        };
    }

    public static videoMsg(
        url: string,
        role: "reference_video" = "reference_video"
    ): SeedanceContent {
        if (!url) throw new Error("videoMsg requires a url");
        return {
            type: "video_url",
            video_url: { url },
            role,
        } as any;
    }

    public static audioMsg(
        url: string,
        role: "reference_audio" = "reference_audio"
    ): SeedanceContent {
        if (!url) throw new Error("audioMsg requires a url");
        return {
            type: "audio_url",
            audio_url: { url },
            role,
        } as any;
    }

    private static async postToSeedance(payload: any) {
        console.log("Seedance request:", payload);
        const data = await postToWorker(payload, "seedance/generate");
        console.log("Seedance response:", data);
        return data;
    }

    // ================= GENERATE VIDEO =================
    public static async generateVideo(options: {
        content: SeedanceContent[];
        model?: string;
        ratio?: string;
        duration?: number;
        generate_audio?: boolean;
        watermark?: boolean;
        resolution?: string;
    }) {
        const {
            content,
            model = "dreamina-seedance-2-0-260128",
            ratio = "adaptive",
            duration,
            generate_audio = true,
            watermark = false,
            resolution
        } = options;

        if (!content || content.length === 0) {
            throw new Error("Content array is required");
        }

        const payload: any = {
            model,
            content,
            generate_audio,
            ratio,
            watermark,
        };

        if (duration !== undefined) { payload.duration = duration; }
        if (resolution) { payload.resolution = resolution; }

        const data = await this.postToSeedance(payload);
        console.log("seed res", data);

        return {
            id: data?.id || data?.task_id || null,
            raw: data,
        };
    }
}
