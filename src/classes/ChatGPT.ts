import OpenAI from "openai";
import type { AIGenerateParms, AIProvider, ImageResult } from "./AI_provider";
import type { AIMessage } from "./GoogleAI";
import { Project } from "./Project";


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
      gpt_image_2: "gpt-image-2",
    },
    image_models: {
      gpt_image_2: "gpt-image-2",

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
      console.log("GPT Response:", response);

      const cost = ChatGPT.calcPrice(response);      
      // SAVE Gen Data
      const proj = Project.getProject();        
      proj.costTracker?.addCost("", "GPT", cost, { model, })

      const text = response.output_text;
      
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
    model: string = ChatGPT.options.models.gpt_5_4,
    images?: { rawBase64: string; mime: string; description: string }[],
    resolution?: string,
  ) {
    try {

      const openai = this.getClient();

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

        //console.log("img_files", file_images);
        let result = null;
        if (!images?.length) {
          const payload: any = {
            model,
            prompt: prompt ?? "",
          };
          if (resolution) payload.size = resolution;
          console.log("GPT_Payload", payload);
          result = await openai.images.generate(payload);
        }
        else {
          const payload: any = {
            model,
            prompt: prompt ?? "",
            image: file_images,
          };
          if (resolution) payload.size = resolution;
          console.log("GPT_Payload", payload);
          result = await openai.images.edit(payload);
        }

        console.log("OPENAI RES", { ...result, ...{ model } });
        const cost = ChatGPT.calcPrice({ ...result, ...{ model } });

        // SAVE Gen Data
        const proj = Project.getProject();        
        proj.costTracker?.addCost("", "GPT", cost, { model, })



        if (result && result.data) {
          const image_base64 = result.data[0].b64_json;
          if (!image_base64) return null;

          return {
            base64Obj: {
              rawBase64: image_base64,
              mime: "image/png",
            },
            id: result._request_id!,
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

        //if (resolution) {          payload.tools[0].size = resolution;        }

        const response = await openai.responses.create(payload);
        console.log("OPENAI RES", response);

        // SAVE Gen Data
        const cost = ChatGPT.calcPrice(response);
        const proj = Project.getProject();        
        proj.costTracker?.addCost("", "GPT", cost, { model, })

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
      const openai = this.getClient();

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
        }

        const res = aspectToPixels(aspect_ratio, resolution);

        return await this.img2img(
          prompts.join(),
          model,
          images,
          res,
        )
      }
      else {
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

        console.log("GPT_MSG_Payload", payload);

        // Get response
        const response = await openai.responses.create(payload);
        console.log("OPENAI RES", response);
        const cost = ChatGPT.calcPrice(response);

        // SAVE Gen Data
        const proj = Project.getProject();
        proj.costTracker?.addCost(response.id ?? "", "GPT", cost, {
          model: response.model,
        })


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

  public static calcPrice(response: any) {
    //console.log("Calculating Price", response);

    const model = response.model.replace(/-\d{4}-\d{2}-\d{2}$/, "");
    //console.log(model);

    const out_price = response.usage.output_tokens * ChatGPT.prices[model].out * 1e-6;
    const in_price = response.usage.input_tokens * ChatGPT.prices[model].in * 1e-6;

    //console.log("Candidate Tokens", out_price);
    //console.log("Prompt Tokens", in_price);
    console.log(`\x1b[32mTotal Price: ${in_price + out_price}$\x1b[0m`);

    return in_price + out_price;
  }

  public static prices: Record<string, any> = {
    "gpt-5.5": {
      out: 30,
      in: 5,
    },
    "gpt-5.4": {
      out: 15,
      in: 2.5,
    },
    "gpt-5.4-mini": {
      out: 4.5,
      in: 0.75,
    },
    "gpt-image-2": {
      out: 30,
      in: 8,
    },
  };


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



