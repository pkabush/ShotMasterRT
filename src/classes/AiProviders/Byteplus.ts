



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


    // Similar pattern to Kling
    public static getApiKey: (() => string | null) | null = null;

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
        const apiKey = this.getApiKey?.();
        if (!apiKey) throw new Error("No Seedance API key provided");

        const targetUrl = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
        //const encodedTarget = encodeURIComponent(targetUrl);
        //const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;

        console.log("Seedance request:", payload);

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Seedance request failed: ${errorText}`);
        }

        const data = await response.json();
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


    public static async getStatus(task_id: string) {
        if (!task_id) throw new Error("task_id is required");

        const apiKey = this.getApiKey?.();
        if (!apiKey) throw new Error("No Seedance API key provided");

        const targetUrl = `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/${task_id}`;
        //const encodedTarget = encodeURIComponent(targetUrl);
        //const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;

        console.log("SEEDANCE Get Status sent");

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Seedance status request failed: ${errorText}`);
        }

        const data = await response.json();
        console.log("Seedance check status:", data);

        return {
            id: data?.id || null,

            status: data?.status || "unknown",
            status_msg: data?.status_msg || "",

            url: data?.content?.video_url || null,

            // useful extras (Seedance actually gives nice metadata)
            duration: data?.duration ?? null,
            ratio: data?.ratio ?? null,
            resolution: data?.resolution ?? null,
            fps: data?.framespersecond ?? null,

            created_at: data?.created_at ?? null,
            updated_at: data?.updated_at ?? null,

            raw: data,
        };
    }
}
