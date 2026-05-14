import OpenAI from "openai";
import type { AIGenerateParms, AIProvider, ImageResult } from "./AI_provider";


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

export class ChatGPT implements AIProvider {
  public static options = {
    models: {
      //gpt_4o_mini: "gpt-4o-mini",
      //gpt_5_1: "gpt-5.1",
      //gpt_5_mini: "gpt-5-mini",
      //gpt_5_nano: "gpt-5-nano",
      gpt_5: "gpt-5",
      gpt_5_4: "gpt-5.4",
      gpt_5_4_mini: "gpt-5.4-mini",
      gpt_5_5: "gpt-5.5",
      //gpt_image_2: "gpt-image-2",      
    }
  }


  // Functions to get/set API key dynamically
  public static getApiKey: (() => string | null) | null = null;
  public static setApiKey: ((key: string) => void) | null = null;

  private static getClient() {
    const key = this.getApiKey?.() || "";
    if (!key) throw new MissingApiKeyError("No OpenAI API key set");
    return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }

  public static async txt2txt(
    input?: string,
    system_msg?: string,
    model: string = "gpt-4o-mini",  // default value    
    images?: { rawBase64: string; mime: string; description?: string }[]
  ) {
    try {
      const client = this.getClient();

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
      const response = await client.responses.create(payload);

      const text = response.output_text;
      console.log("GPT Response TEXT:", { "text": text });
      return text;

    } catch (err: any) {
      console.error("ChatGPT Error:", err);

      const message = err?.message || "";
      if (message.includes("Incorrect API key provided") || err instanceof MissingApiKeyError) {
        const userKey = window.prompt("Your OpenAI API key is missing or invalid. Please enter a valid key:");
        if (userKey) {
          this.setApiKey?.(userKey);
        } else {
          console.warn("User did not provide a valid API key.");
        }
        return null;
      }

      throw err;
    }
  }


  // ---------- img2img function ----------
  public static async img2img(
    prompt?: string,
    model: string = ChatGPT.options.models.gpt_5,
    images?: { rawBase64: string; mime: string; description: string }[],
    resolution?: string,
  ) {
    try {
      const openai = this.getClient();

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

      const payload:any = {
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

      if (resolution) {
        payload.tools[0].size = resolution;
      }

      console.log("OpenAI Payload", payload);

      const response = await openai.responses.create(payload);
      console.log("OPENAI RES", response);

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

      return null;

    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log("INPUT GPT KEY!");
        //this.showKeyPromptWindow();
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

    //const resolution = aspectToPixels(params.aspect_ratio, params.resolution);

    // Only gpt-image supports resolution, other models only give 1024x1024/ 2x3 of same res
    const res = await ChatGPT.img2img(
      params.prompt,
      params.model,
      params.images,
      //resolution
    );



    if (!res) return null;

    return res;
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
  aspect: string = "9:16",
  resolution: string = "1K"
): string | undefined {
  if ((!aspect || aspect === "none") && (!resolution || resolution === "none"))
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



