import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { LocalVideo } from "../fileSystem/LocalVideo";

export class FFmpegService {
    private static _instance: FFmpegService;

    private ffmpeg = new FFmpeg();

    private loaded = false;
    private loadingPromise: Promise<void> | null = null;

    static get instance(): FFmpegService {
        if (!this._instance) {
            this._instance = new FFmpegService();
        }

        return this._instance;
    }

    private constructor() {

        this.ffmpeg.on("log", ({ message }) => {
            console.log("[FFmpeg]", message);
        });

        this.ffmpeg.on("progress", ({ progress, time }) => {
            console.log(
                "[FFmpeg Progress]",
                progress,
                time
            );
        });

    }

    async load() {
        if (this.loaded) return;
        console.log("Loading FFMPEG");

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = (async () => {

            try {

                //const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm";
                const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

                console.log("Loading core...");
                const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript");

                console.log("Loading wasm...");
                const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm");

                //console.log("Loading worker...");
                //const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript");

                console.log("Initializing ffmpeg...");
                await this.ffmpeg.load({
                    coreURL,
                    wasmURL,
                    //workerURL 
                });

                this.loaded = true;
                console.log("FFMPEG Loaded!");

            } catch (err) {
                console.error("FFMPEG LOAD FAILED", err);
                throw err;
            } finally {
                this.loadingPromise = null;
            }

        })();

        return this.loadingPromise;
    }

    async writeFile(
        name: string,
        data: File | Uint8Array
    ) {
        await this.load();

        const payload =
            data instanceof File
                ? await fetchFile(data)
                : data;

        await this.ffmpeg.writeFile(name, payload);
    }

    async exec(args: string[]) {
        await this.load();

        return this.ffmpeg.exec(args);
    }

    async readFile(path: string) {
        await this.load();

        return this.ffmpeg.readFile(path);
    }

    async deleteFile(path: string) {
        try {
            await this.ffmpeg.deleteFile(path);
        } catch { }
    }

    onProgress(cb: (progress: number) => void) {
        this.ffmpeg.on("progress", ({ progress }) => {
            cb(progress);
        });
    }
}




export async function trimVideo(
    video: LocalVideo
): Promise<Blob> {
    const ffmpeg = FFmpegService.instance;
    const extension = video.name.split(".").pop() || "mp4";
    const inputName = `input-${crypto.randomUUID()}.${extension}`;
    const outputName = `output-${crypto.randomUUID()}.mp4`;

    try {
        const file = await video.getFile();

        await ffmpeg.writeFile(inputName, file);

        await ffmpeg.exec([
            "-ss", video.start_timecode.toString(),
            "-i", inputName,
            "-to", video.end_timecode.toString(),

            "-c", "copy",
            //"-c:v", "libx264",
            //"-preset", "ultrafast",
            //"-c:a", "aac",

            outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);
        return new Blob([data.slice(0)], { type: "video/mp4", });
    } finally {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
    }
}

export async function combineAndTrim(
    videos: LocalVideo[]
): Promise<Blob> {

    const ffmpeg = FFmpegService.instance;

    try {
        console.log("COMBINING (normalize + concat pipeline)!");

        const normalizedFiles: string[] = [];

        // =========================
        // 1. NORMALIZE EACH VIDEO
        // =========================
        for (let i = 0; i < videos.length; i++) {
            const v = videos[i];

            const input = `in-${i}.mp4`;
            const output = `clip-${i}.mp4`;

            await ffmpeg.writeFile(input, await v.getFile());

            console.log(`NORMALIZING ${input}`);

            await ffmpeg.exec([
                "-i", input,
                "-ss", v.start_timecode.toString(),
                "-to", v.end_timecode.toString(),


                // IMPORTANT: force identical format for concat
                "-vf",
                "scale=720:1280:force_original_aspect_ratio=decrease," +
                "pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1",

                "-r", "24",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-pix_fmt", "yuv420p",

                output,
            ]);

            normalizedFiles.push(output);

            // optional cleanup of raw input early (saves memory)
            try {
                await ffmpeg.deleteFile(input);
            } catch { }
        }

        // =========================
        // 2. CONCAT (SAFE MODE)
        // =========================
        console.log("CONCATING...");

        const list = normalizedFiles
            .map(f => `file '${f}'`)
            .join("\n");

        await ffmpeg.writeFile(
            "list.txt",
            new TextEncoder().encode(list)
        );

        const finalName = "final.mp4";

        await ffmpeg.exec([
            "-f", "concat",
            "-safe", "0",
            "-i", "list.txt",

            // IMPORTANT: no re-encode here
            "-c", "copy",

            finalName,
        ]);

        // =========================
        // 3. READ OUTPUT
        // =========================
        const data = await ffmpeg.readFile(finalName);

        return new Blob([data.slice(0)], { type: "video/mp4" });

    } finally {

        // =========================
        // CLEANUP
        // =========================
        for (let i = 0; i < videos.length; i++) {
            try {
                await ffmpeg.deleteFile(`clip-${i}.mp4`);
            } catch { }
        }

        try {
            await ffmpeg.deleteFile("list.txt");
        } catch { }

        try {
            await ffmpeg.deleteFile("final.mp4");
        } catch { }
    }
}



export async function combineVideosFromUint8(
    videos: Uint8Array[]
): Promise<Blob> {

    const ffmpeg = FFmpegService.instance;

    try {
        const inputs: string[] = [];

        // =========================
        // 1. WRITE INPUT FILES
        // =========================
        for (let i = 0; i < videos.length; i++) {
            const name = `in-${i}.mp4`;
            await ffmpeg.writeFile(name, videos[i]);
            inputs.push(name);
        }

        // =========================
        // 2. CREATE CONCAT LIST
        // =========================
        const list = inputs.map(f => `file '${f}'`).join("\n");
        await ffmpeg.writeFile("list.txt", new TextEncoder().encode(list));

        // =========================
        // 3. CONCAT (NO RE-ENCODE)
        // =========================
        const output = "final.mp4";

        await ffmpeg.exec([
            "-f", "concat",
            "-safe", "0",
            "-i", "list.txt",
            "-c", "copy",
            output,
        ]);

        // =========================
        // 4. READ RESULT
        // =========================
        const data = await ffmpeg.readFile(output);

        return new Blob([data.slice(0)], {
            type: "video/mp4",
        });

    } finally {

        // =========================
        // 5. CLEANUP
        // =========================
        for (let i = 0; i < videos.length; i++) {
            try {
                await ffmpeg.deleteFile(`in-${i}.mp4`);
            } catch { }
        }

        try { await ffmpeg.deleteFile("list.txt"); } catch { }
        try { await ffmpeg.deleteFile("final.mp4"); } catch { }
    }
}