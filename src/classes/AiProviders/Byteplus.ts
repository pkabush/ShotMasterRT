import { type AIGenerateParms, type AIProvider, type AIResult, type ImageResult } from "../AI_provider";
import { postToWorker } from "../CloudflareWorker/WorkerUtils";
import { LocalImage } from "../fileSystem/LocalImage";

//import { getSeedanceSendImages } from "../../components/BytePlus/SeedanceHelper";
import { useUserStore } from "../../contexts/GoogleUserContext";
import AI_Utils, { type AIMessage } from "./AI_message_utils";



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
        ? `https://subalate-evia-squelchingly.ngrok-free.dev/`
        : `https://shotmasterworker.kabushpavel.workers.dev/`;


export class SeedanceAI implements AIProvider {
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

        },
        image_models: [
            "dola-seedream-5-0-pro-260628",
            "dola-seedream-5-0-flash-260915",
            "seedream-5-0-lite-260128",
        ],
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
            if (await url.getByteplusAssetStatus()) {
                parsed_url = "asset://" + url.mediaJson?.getField("byteplus_id");
            }
            //else if (getSeedanceSendImages())
            //    parsed_url = await url.uploadToR2();
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
            image_url: { url: parsed_url },
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
        const callback = new URL(SEEDANCE_CALLBACK_URL + "seedance/callback");

        callback.searchParams.set("hasVideo", hasVideo);
        callback.searchParams.set("user", useUserStore.getState().user?.sub ?? "");

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
        draft?: boolean;
    }) {
        const {
            content,
            model = "dreamina-seedance-2-0-260128",
            ratio = "adaptive",
            duration,
            generate_audio = true,
            watermark = false,
            resolution,
            draft = false,
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
        if (draft) {
            payload.draft = true;
            payload.resolution = "480p";
        }

        const data = await this.postToSeedance(payload);
        console.log("seed res", data);

        return {
            id: data?.id || data?.task_id || null,
            raw: data,
        };
    }

    public static async renderDraft(options: {
        model: string;
        draft_id: boolean;
    }) {
        const { model, draft_id } = options;
        
        const payload: any = {
            model,
            resolution: "1080p",
            content:[{
                type:"draft_task",
                draft_task: {
                    "id":draft_id,
                }
            }]
        };

        const data = await this.postToSeedance(payload);
        console.log("seed res", data);

        return {
            id: data?.id || data?.task_id || null,
            raw: data,
        };
    }

    async generateText(params: AIGenerateParms): Promise<string | null> {
        console.log("Byteplus Generate Text Not Implemented", params);
        return null
    }

    async generateImage(params: AIGenerateParms): Promise<ImageResult | null> {
        //console.log("Byteplus Generate Image Not Implemented", params);
        const messages: AIMessage[] = [];
        if (params.prompt) { messages.push(params.prompt); }
        if (params.images?.length) { messages.push(...params.images); }
        const res = await this.sendMessages(messages, params.model ?? SeedanceAI.options.image_models[0], params.aspect_ratio, params.resolution);
        if (!res) return null;
        return res as ImageResult;
    }

    async sendMessages(
        messages: AIMessage[],
        model: string,
        aspect_ratio?: string,
        resolution?: string,
    ): Promise<AIResult | null> {
        try {
            console.log("Bytedance Send Messages", { messages, model, aspect_ratio, resolution });

            const image_models = new Set(SeedanceAI.options.image_models);
            // Gather Image response
            if (image_models.has(model)) {
                const prompt = AI_Utils.messagesToJoinedPrompt(messages);
                const images = AI_Utils.messagesToLocalImages(messages)
                console.log("[Byteplus] Generating Image", { model, prompt, images });


                const size = getResolution(resolution, aspect_ratio);

                // Create Payload
                const payload: any = {
                    model,
                    prompt,
                    image: await Promise.all(
                        images.map(async (img) => {
                            const ai_image = await img.getAIImage();
                            return `data:${ai_image.mime};base64,${ai_image.rawBase64}`;
                        })
                    ),
                    size,
                    watermark: false,
                    response_format: "b64_json",
                    output_format: "png",
                };

                console.log("[Bytedance] Payload:", payload)
                const response = await postToWorker(payload, "seedance/generate-image", { model, size });
                console.log("[Bytedance] Response:", response);

                return {
                    base64Obj: {
                        rawBase64: response.data[0].b64_json,
                        mime: `image/${response.data[0].output_format}`,
                    },
                    id: AI_Utils.generateImageName(model, "generate"),
                };

            }
        } catch (error) {
            console.error("[BytePlus] Image generation failed", {
                model,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown image generation error",
            });

            return null;
        }

        return null;
    }

}



type Resolution = "1K" | "1.5K" | "2K";

type Aspect =
    | "1:1"
    | "4:3"
    | "3:4"
    | "16:9"
    | "9:16"
    | "3:2"
    | "2:3"
    | "21:9";

const resolutions: Record<Resolution, Partial<Record<Aspect, string>>> = {
    "1K": {
        "1:1": "1024x1024",
        "4:3": "1152x864",
        "3:4": "864x1152",
        "16:9": "1424x800",
        "9:16": "800x1424",
        "3:2": "1248x832",
        "2:3": "832x1248",
        "21:9": "1568x672",
    },
    "1.5K": {
        "1:1": "1536x1536",
        "4:3": "1792x1344",
        "3:4": "1344x1792",
        "16:9": "2048x1152",
        "9:16": "1152x2048",
        "3:2": "1872x1248",
        "2:3": "1248x1872",
        "21:9": "2352x1008",
    },
    "2K": {
        "1:1": "2048x2048",
        "4:3": "2368x1776",
        "3:4": "1776x2368",
        "16:9": "2816x1584",
        "9:16": "1584x2816",
        "3:2": "2496x1664",
        "2:3": "1664x2496",
        "21:9": "3136x1344",
    },
};


function getResolution(
    resolution?: string,
    aspect?: string,
): string {
    const selectedAspect = aspect ?? "1:1";

    const validAspect = Object.keys(resolutions["1K"]).includes(
        selectedAspect,
    )
        ? selectedAspect as Aspect
        : "1:1";

    const selectedResolution =
        resolution && resolution in resolutions
            ? resolution as Resolution
            : "1K";

    if (resolution && !(resolution in resolutions)) {
        console.error(
            `Unsupported resolution: ${resolution}. Defaulting to 1K.`,
        );
    }

    if (aspect && !Object.keys(resolutions["1K"]).includes(aspect)) {
        console.error(
            `Unsupported aspect: ${aspect}. Defaulting to 1:1.`,
        );
    }

    return resolutions[selectedResolution][validAspect]
        ?? resolutions["1K"]["1:1"]!;
}