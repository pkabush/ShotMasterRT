import type { AIGenerateParms, AIProvider, AIResult, ImageResult } from "./AI_provider";
import type { AIMessage } from "./GoogleAI";
import { postToWorker } from "./CloudflareWorker/WorkerUtils";
import { LocalImage } from "./fileSystem/LocalImage";

// Custom error types for clarity
export class MissingApiKeyError extends Error { }
export class InvalidApiKeyError extends Error { }

export const models = [
  "gpt-4o-mini",
  "gpt-5.1",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5",
]

function base64ToFile(base64: any, filename: any, mimeType: any) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);

  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  return new File([blob], filename, { type: mimeType });
}

function generateImageName(
  model: string,
  action: "generate" | "edit"
) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  return `${model}-${action}-${timestamp}`;
}

export class ChatGPT implements AIProvider {
  public static options = {
    models: {
      //gpt_4o_mini: "gpt-4o-mini",
      //gpt_5_1: "gpt-5.1",
      //gpt_5_mini: "gpt-5-mini",
      //gpt_5_nano: "gpt-5-nano",
      //gpt_5: "gpt-5",
      gpt_5_4: "gpt-5.4",
      gpt_5_4_mini: "gpt-5.4-mini",
      gpt_5_5: "gpt-5.5",
      gpt_5_6_sol: "gpt-5.6-sol",
      gpt_5_6_terra: "gpt-5.6-terra",
      gpt_5_6_luna: "gpt-5.6-luna",
      gpt_image_2: "gpt-image-2",
      gpt_image_2_2_sunburst: "gpt-image-2.5-sunburst",
      gpt_image_2_2_flare: "gpt-image-2.5-flare",
    },
    image_models: {
      gpt_image_2: "gpt-image-2",
      gpt_image_2_2_sunburst: "gpt-image-2.5-sunburst",
      gpt_image_2_2_flare: "gpt-image-2.5-flare",
    },
    audio_generation: {
      voices: ["alloy",
        "ash",
        "ballad",
        "coral",
        "echo",
        "fable",
        "nova",
        "onyx",
        "sage",
        "shimmer",
        "verse",
        "marin",
        "cedar",],
      models: [
        "tts-1",
        "tts-1-hd",
        "gpt-4o-mini-tts",
        "gpt-4o-mini-tts-2025-12-15",
      ],
      speed: ["0.5", "0.75", "1.0", "1.25", "1.5", "1.75", "2.0"],
    }
  }

  public static async img2img(
    prompt?: string,
    model: string = ChatGPT.options.models.gpt_5_4,
    images?: { rawBase64: string; mime: string; description: string }[],
    resolution?: string,
  ) {
    try {
      if (!Object.values(ChatGPT.options.image_models).includes(model)) { return null; }

      // Filter out invalid images first
      const validImages = images?.filter((img) => img?.rawBase64 && img?.mime) ?? [];
      let response: any;
      let isEdit = false;

      /*
       * No images:
       * Send normal JSON to /v1/images/generations
       */
      if (validImages.length === 0) {
        const payload: any = { model, prompt: prompt ?? "", };
        if (resolution) { payload.size = resolution; }
        console.log("GPT image request:", payload);
        response = await postToWorker(payload, "gpt/generate-image", { model });
      }

      /*
       * Images present:
       * Send multipart/form-data to /v1/images/edits
       */
      else {
        isEdit = true;
        const form = new FormData();
        form.append("model", model);
        form.append("prompt", prompt ?? "");
        //form.append("quality", "low");

        if (resolution) { form.append("size", resolution); }

        let img_id = 0;
        for (const img of validImages) {
          const extension = img.mime.split("/")[1]?.split("+")[0] || "png";
          const file = base64ToFile(img.rawBase64, `image${img_id}.${extension}`, img.mime);
          // OpenAI edits API expects image[]
          form.append("image[]", file);
          img_id++;
        }

        console.log("GPT image request:", { model, prompt, imageCount: img_id, resolution });
        response = await postToWorker(form, "gpt/generate-image", { model });
      }

      console.log("GPT Response:", response);

      const name = generateImageName(model, isEdit ? "edit" : "generate");

      if (response?.data) {
        const image_base64 = response.data[0]?.b64_json;
        if (!image_base64) { return null; }
        return { base64Obj: { rawBase64: image_base64, mime: "image/png", }, id: name, };
      }

      return null;

    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log("INPUT GPT KEY!");
        return null;
      }

      console.error("img2img error", err);
      throw err;
    }
  }

  async generateText(params: AIGenerateParms): Promise<string | null> {
    const messages: AIMessage[] = [];
    if (params.prompt) { messages.push(params.prompt); }
    if (params.images?.length) { messages.push(...params.images); }
    const res = await ChatGPT.sendMessages(messages, params.model);
    return res
  }

  async generateImage(params: AIGenerateParms): Promise<ImageResult | null> {
    const messages: AIMessage[] = [];
    if (params.prompt) { messages.push(params.prompt); }
    if (params.images?.length) { messages.push(...params.images); }
    const res = await ChatGPT.sendMessages(messages, params.model, params.aspect_ratio, params.resolution);
    return res;
  }


  async sendMessages(
    messages: AIMessage[],
    model: string,
    aspect_ratio?: string,
    resolution?: string,
  ): Promise<AIResult | null> {
    return ChatGPT.sendMessages(
      messages,
      model,
      aspect_ratio,
      resolution,
    );
  }

  // New Message Type Function
  public static async sendMessages(
    messages: AIMessage[],
    model: string = ChatGPT.options.models.gpt_5_5,
    aspect_ratio?: string,
    resolution?: string,
    gen_image: boolean = true,
  ) {
    try {
      // SWITHC ON MODEL
      if (Object.values(ChatGPT.options.image_models).includes(model)) {
        // Image Model Use Image Generation API
        // - allows only one prompt and multiple images
        const images: { rawBase64: string; mime: string; description: string }[] = [];
        const prompts: string[] = [];

        // Convert Mesasges into [prompt + images]
        for (const message of messages) {
          // Plain string
          if (typeof message === "string") {
            if (message.trim()) { prompts.push(message); }
            continue;
          }
          // Raw image object
          if ("rawBase64" in message && "mime" in message) {
            images.push(message);
            continue;
          }
          // Local Image
          if (message instanceof LocalImage) {
            const image = await message.getAIImage()
            images.push({
              rawBase64: image.rawBase64,
              mime: image.mime,
              description: ""
            });
            continue;
          }
        }

        console.log("GPT ASPECT", aspect_ratio, resolution);
        const res = aspectToPixels(aspect_ratio, resolution);

        return await this.img2img(
          prompts.join(),
          model,
          images,
          res,
        )
      }
      else {
        // Non Image Models
        const content: any[] = [];

        // Gather all the messages
        for (const message of messages) {
          // Plain string
          if (typeof message === "string") {
            if (message.trim()) {
              content.push({ type: "input_text", text: message });
            }
            continue;
          }

          // Raw image object
          if ("rawBase64" in message && "mime" in message) {
            content.push({
              type: "input_image",
              image_url: `data:${message.mime};base64,${message.rawBase64}`,
            });
            continue;
          }

          // Local Image
          if (message instanceof LocalImage) {
            const image = await message.getAIImage()
            //const img_url = await message.uploadToR2();
            content.push({
              type: "input_image",
              image_url: `data:${image.mime};base64,${image.rawBase64}`,
              //image_url: img_url,
            });
            continue;
          }
        }

        // Create Payload
        const payload: any = {
          model,
          input: [
            {
              role: "user" as const,
              content,
            },
          ],
        };

        if (gen_image) payload.tools = [{
          type: "image_generation" as const,
        }];

        // POST TO WORKER
        console.log("GPT Payload:", payload)
        const response = await postToWorker(payload, "gpt/generate");
        console.log("GPT Response:", response);

        // Return Image or Text
        const imageData = response.output
          ?.filter((o: any) => o.type === "image_generation_call")
          ?.map((o: any) => o.result);

        if (imageData?.length) {
          const base64 = imageData[0];
          return {
            base64Obj: {
              rawBase64: base64,
              mime: "image/png",
            },
            id: response.id,
          };
        }

        const finalAnswer = response.output
          ?.filter((o: any) => o.type === "message")
          ?.filter((o: any) => o.phase === "final_answer")
          ?.flatMap((o: any) =>
            o.content
              ?.filter((c: any) => c.type === "output_text")
              ?.map((c: any) => c.text)
          )
          ?.join("");

        return finalAnswer || "";
        //const text = response.output_text;
        //return text;
      }

    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log("INPUT GPT KEY!");
        return null;
      }

      console.error("img2img error", err);
      throw err;
    }
  }

  public static async generateAudio(
    input: string,
    voice: string = "coral",
    model: string = "tts-1-hd",
    instructions?: string,
    response_format: string = "mp3",
    speed?: number,
  ): Promise<Blob | null> {
    try {
      const payload: any = {
        input,
        voice,
        response_format,
        model
      };

      if (instructions) {
        payload.instructions = instructions;
      }

      if (speed !== undefined) {
        payload.speed = speed;
      }

      console.log("GPT Audio Payload:", payload);

      const audio = await postToWorker(
        payload,
        "gpt/generate-audio",
        { model },
        "blob"
      );

      return audio;

    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log("INPUT GPT KEY!");
        return null;
      }

      console.error("generateAudio error", err);
      throw err;
    }
  }


  public static async generateAudioPack(
    requests: AudioPackRequest[],
    model: string = "tts-1-hd",
  ): Promise<Blob[] | null> {
    try {
      if (!requests.length) {
        return [];
      }

      const payload = requests.map((request) => ({
        ...request,
        model: model,
      }));

      console.log("GPT Audio Pack Payload:", payload);

      const response = await postToWorker(
        payload,
        "gpt/generate-audio-pack",
        { model },
      );

      if (!response?.results || !Array.isArray(response.results)) {
        throw new Error("Invalid audio pack response");
      }

      // Server guarantees results are returned in input order.
      return response.results.map((result: any) =>
        base64ToBlob(
          result.data,
          result.mime_type || "audio/mpeg",
        )
      );

    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log("INPUT GPT KEY!");
        return null;
      }

      console.error("generateAudioPack error", err);
      throw err;
    }
  }


}


export type AudioPackRequest = {
  input: string;
  voice?: string;
  instructions?: string;
  response_format?: string;
  speed?: number;
};

function base64ToBlob(
  base64: string,
  mimeType: string = "audio/mpeg",
): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);

  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }

  return new Blob([byteNumbers], {
    type: mimeType,
  });
}



// Resolutions Mapping
const RESOLUTION_MAP: Record<string, number> = {
  "none": 1024,
  "0.5K": 512,
  "1K": 1024,
  "2K": 2048,
  "4K": 3840,
};

function roundTo16(value: number): number {
  return Math.round(value / 16) * 16;
}

export function aspectToPixels(
  aspect: string | undefined,
  resolution: string | undefined,
): string | undefined {
  if (((aspect == null) || aspect === "none") && ((resolution == null) || resolution === "none"))
    return undefined;

  // defaults
  if (!aspect || aspect === "none") {
    aspect = "9:16";
  }

  if (!resolution || resolution === "none") {
    resolution = "1K";
  }

  const maxSide = RESOLUTION_MAP[resolution];

  const [wRatio, hRatio] = aspect.split(":").map(Number);

  let width: number;
  let height: number;

  // Bigger aspect side gets the max resolution
  if (wRatio >= hRatio) {
    width = maxSide;
    height = (maxSide * hRatio) / wRatio;
  } else {
    height = maxSide;
    width = (maxSide * wRatio) / hRatio;
  }

  // Ensure divisible by 16
  width = roundTo16(width);
  height = roundTo16(height);

  return `${width}x${height}`;
}



