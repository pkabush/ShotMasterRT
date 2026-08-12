import type { AIGenerateParms, AIProvider, ImageResult } from "./AI_provider";
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
      gpt_5_6_sol : "gpt-5.6-sol",
      gpt_5_6_terra : "gpt-5.6-terra",
      gpt_5_6_luna : "gpt-5.6-luna",
      gpt_image_2: "gpt-image-2",
    },
    image_models: {
      gpt_image_2: "gpt-image-2",

    }
  }

  public static async txt2txt(
    input?: string,
    system_msg?: string,
    model: string = "gpt-4o-mini",  // default value    
    images?: { rawBase64: string; mime: string; description?: string }[]
  ) {
    try {
      const messages: any[] = [];

      // Add system message if provided
      if (system_msg) {
        messages.push({ role: "system", content: system_msg });
      }

      // Add user text message if provided
      const content: any[] = [];

      if (input) {
        content.push({
          type: "input_text",
          text: input,
        });
      }

      if (images?.length) {
        for (const img of images) {
          if (!img?.rawBase64 || !img?.mime) continue;

          if (img.description) {
            content.push({
              type: "input_text",
              text: img.description,
            });
          }

          content.push({
            type: "input_image",
            image_url: `data:${img.mime};base64,${img.rawBase64}`,
          });
        }
      }

      messages.push({
        role: "user",
        content
      });

      const payload = {
        model: model,
        input: messages,
      }

      console.log("GPT Payload:", payload)
      const response = await postToWorker(payload, "gpt/generate");
      console.log("GPT Response:", response);

      const text = response.output_text;

      return text;

    } catch (err: any) {
      throw err;
    }
  }

  // ---------- img2img function ----------
  public static async img2img(
    prompt?: string,
    model: string = ChatGPT.options.models.gpt_5_4,
    images?: { rawBase64: string; mime: string; description: string }[],
    resolution?: string,
  ) {
    try {

      if (Object.values(ChatGPT.options.image_models).includes(model)) {

        const file_images: File[] = [];
        // Add images        
        let img_id = 0;
        if (images?.length) {
          for (const img of images) {
            if (!img?.rawBase64 || !img?.mime) continue;
            const img_file = base64ToFile(img.rawBase64, `image${img_id}.png`, img.mime);
            file_images.push(img_file);
            img_id++;
          }
        }

        // Create Payload
        const payload: any = {
          model,
          prompt: prompt ?? "",
        };
        if (images?.length) {
          payload.images = images.map(img => ({
            base64: img.rawBase64,
            mime: img.mime,
          }));
        }
        if (resolution) payload.size = resolution;

        // POST TO WORKER
        console.log("GPT Payload:", payload)
        const response = await postToWorker(payload, "gpt/generate");
        console.log("GPT Response:", response);

        const name = generateImageName(
          "gpt-image-2",
          images?.length ? "edit" : "generate"
        );

        if (response && response.data) {
          const image_base64 = response.data[0].b64_json;
          if (!image_base64) return null;

          return {
            base64Obj: {
              rawBase64: image_base64,
              mime: "image/png",
            },
            id: name,
          };
        }
      }
      else {
        // RESPONSES API

        const content: any[] = [];
        if (prompt) content.push({ type: "input_text", text: prompt });

        // Add images
        if (images?.length) {
          for (const img of images) {
            if (!img?.rawBase64 || !img?.mime) continue;

            if (img.description) {
              content.push({
                type: "input_text",
                text: img.description,
              });
            }

            content.push({
              type: "input_image",
              image_url: `data:${img.mime};base64,${img.rawBase64}`,
            });
          }
        }


        const payload: any = {
          model,
          input: [
            {
              role: "user" as const,
              content,
            },
          ],
          tools: [{
            type: "image_generation" as const,
          }],
        };

        // POST TO WORKER
        console.log("GPT Payload:", payload)
        const response = await postToWorker(payload, "gpt/generate");
        console.log("GPT Response:", response);

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
    const text = await ChatGPT.txt2txt(
      params.prompt,
      params.system,
      params.model,
      params.images
    );

    return text
  }

  async generateImage(params: AIGenerateParms): Promise<ImageResult | null> {

    const resolution = aspectToPixels(params.aspect_ratio, params.resolution);

    // Only gpt-image supports resolution, other models only give 1024x1024/ 2x3 of same res
    const res = await ChatGPT.img2img(
      params.prompt,
      params.model,
      params.images,
      resolution
    );

    if (!res) return null;

    return res;
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
            content.push({
              type: "input_image",
              image_url: `data:${image.mime};base64,${image.rawBase64}`,
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

        const text = response.output_text;
        return text;
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


}

// Resolutions Mapping
const RESOLUTION_MAP: Record<string, number> = {
  "none": 1024,
  "0.5K": 512,
  "1K": 1024,
  "2K": 2048,
  "4K": 4096,
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



