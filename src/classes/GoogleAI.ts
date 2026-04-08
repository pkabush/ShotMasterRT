// classes/GoogleGenAI.ts
import { GoogleGenAI as GoogleSDK } from "@google/genai";
import { LocalImage } from "./fileSystem/LocalImage";
import type { LocalFolder } from "./fileSystem/LocalFolder";
import type { AIGenerateParms, AIImageInput, AIProvider, ImageResult } from "./AI_provider";

// Custom error types for clarity
export class MissingApiKeyError extends Error { }
export class InvalidApiKeyError extends Error { }


export class GoogleAI implements AIProvider {
  public static options = {
    img_models: {
      flash_image: "gemini-2.5-flash-image",
      pro_image: "gemini-3-pro-image-preview",
      flash_3_1: "gemini-3.1-flash-image-preview",
    },
    aspect_ratios: {
      r1x1: "1:1",
      r2x3: "2:3",
      r3x2: "3:2",
      r3x4: "3:4",
      r4x3: "4:3",
      r4x5: "4:5",
      r5x4: "5:4",
      r9x16: "9:16",
      r16x9: "16:9",
      r21x9: "21:9",
      none: "none",
    },

    text_models: {
      gemini_3_1_flash_lite: "gemini-3.1-flash-lite-preview",
      gemini_3_1_pro_preview: "gemini-3.1-pro-preview",
      gemini_3_flash_preview: "gemini-3-flash-preview",
    }
  }

  // Functions to get/set API key dynamically
  public static getApiKey: (() => string | null) | null = null;
  public static setApiKey: ((key: string) => void) | null = null;

  private static getGenAI() {
    const key = this.getApiKey?.() || "";
    console.log(key);
    if (!key) throw new MissingApiKeyError("No Google API key set");
    return new GoogleSDK({ apiKey: key });
  }

  // ---------- img2img function ----------
  public static async img2img(
    prompt?: string,
    model: string = GoogleAI.options.img_models.flash_image,
    images?: AIImageInput[],
    aspect_ratio?: string,
  ) {
    try {
      const genAI = this.getGenAI();
      // Add prompt Text
      const contents: any[] = [];
      if (prompt) contents.push({ text: prompt });
      // Add Images
      if (images?.length) {
        for (const img of images) {
          if (!img?.rawBase64 || !img?.mime) continue;
          if (img.description) contents.push({ text: img.description });
          contents.push({ inlineData: { data: img.rawBase64, mimeType: img.mime }, });
        }
      }
      // Generate Payload
      const isImageModel = Object.values(GoogleAI.options.img_models).includes(model);
      const config: any = {};
      if (isImageModel) {
        config.response_modalities = ["Image"];
        if (aspect_ratio && aspect_ratio != "none") {
          config.imageConfig = { aspectRatio: aspect_ratio };
        }
      }
      const payload = {
        model,
        contents,
        config,
      };
      console.log("Gemini Payload", payload);
      // Get Response
      const response = await genAI.models.generateContent(payload);
      console.log("GEMINI RES", response);
      // Iterate response parts
      // If IMAGE Modesl
      if (isImageModel) {
        const candidates = response?.candidates ?? [];
        const parts = candidates[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData) {
            return {
              base64Obj: {
                rawBase64: part.inlineData.data,
                mime: part.inlineData.mimeType || "image/png",
              },
              id: response.responseId,
            };
          }
        }
      }
      // IF TEXT Model
      return response.text;

    } catch (err: any) {
      const message = err?.message || "";
      if (message.includes("API key not valid") || message.includes("API_KEY_INVALID") || err instanceof MissingApiKeyError) {
        this.showKeyPromptWindow()
        return null;
      }
      console.error("img2img error", err);
      throw err;
    }
  }

  private static showKeyPromptWindow() {
    const userKey = window.prompt("Your Google API key is missing or invalid. Please enter a valid key:");
    if (userKey) {
      this.setApiKey?.(userKey);
    } else {
      console.warn("User did not provide a valid API key.");
    }
  }

  public static async saveResultImage(result: any, folder: LocalFolder) {
    if (result && result.base64Obj?.rawBase64) {
      console.log(result.base64Obj.mime.split("/")[1]);
      const localImage = await LocalImage.fromBase64(
        {
          rawBase64: result.base64Obj.rawBase64,
          mime: result.base64Obj.mime
        },
        folder,
        `${result.id}.${result.base64Obj.mime.split("/")[1]}`
      );
      return localImage;
    } else {
      console.warn("No valid image returned from GoogleAI.img2img");
      return null;
    }
  }

  async generateText(params: AIGenerateParms): Promise<string | null> {
    const res = await GoogleAI.img2img(
      params.prompt,
      params.model,
      params.images,
    );
    if (!res) return null;
    return res as string;
  }

  async generateImage(params: AIGenerateParms): Promise<ImageResult | null> {
    const res = await GoogleAI.img2img(
      params.prompt,
      params.model,
      params.images,
      params.aspect_ratio,      
    );
    if (!res) return null;
    return res as ImageResult;
  }







}

