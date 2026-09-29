import { getSeedanceSendImages } from "../../components/BytePlus/SeedanceHelper";
import { useGoogleStore } from "../../contexts/GoogleUserContext";
import { postToWorker } from "../CloudflareWorker/WorkerUtils";
import { LocalImage } from "../fileSystem/LocalImage";

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


const test_web = false
export const SEEDANCE_CALLBACK_URL =
    import.meta.env.DEV && !test_web
        ? `https://subalate-evia-squelchingly.ngrok-free.dev/seedance/callback`
        : `https://shotmasterworker.kabushpavel.workers.dev/seedance/callback`;


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
                "16": "16",
                "17": "17",
                "18": "18",
                "19": "19",
                "20": "20",
                "21": "21",
                "22": "22",
                "23": "23",
                "24": "24",
                "25": "25",
                "26": "26",
                "27": "27",
                "28": "28",
                "29": "29",
                "30": "30",
            },
            models: {
                "seed_2.0": "dreamina-seedance-2-0-260128",
                "seed_2.5": "dreamina-seedance-2-5-260628",
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

    public static async imgMsg(
        url: string | LocalImage,
        role: "reference_image" | "first_frame" | "last_frame" | undefined = "reference_image"
    ): Promise<SeedanceContent> {
        if (!url) throw new Error("imgMsg requires a url");

        let parsed_url;
        if (url instanceof LocalImage) {
            if (getSeedanceSendImages())
                parsed_url = await url.uploadToR2();
            else {
                const base64 = await url.getBase64();
                parsed_url = `data:${base64.mime};base64,${base64.rawBase64}`;
            }
        }
        else {
            parsed_url = url;
        }

        return {
            type: "image_url",
            image_url: { url:parsed_url },
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
        const hasVideo = payload.content.some((item: any) => item.type === "video_url");
        // CALLBACK ONLY WORKS FOR SERVER        
        //const callback = new URL(`https://shotmasterworker.kabushpavel.workers.dev/seedance/callback`);
        //const callback = new URL(`https://subalate-evia-squelchingly.ngrok-free.dev/seedance/callback`);
        const callback = new URL(SEEDANCE_CALLBACK_URL);

        callback.searchParams.set("hasVideo", hasVideo);
        callback.searchParams.set("user", useGoogleStore.getState().user?.email ?? "");
        payload.callback_url = callback.toString();

        const data = await postToWorker(payload, "seedance/generate", { model: payload.model, });
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
