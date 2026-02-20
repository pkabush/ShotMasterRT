// classes/GoogleGenAI.ts
import { GoogleGenAI as GoogleSDK } from "@google/genai";
import { LocalImage } from "./LocalImage";
import type { LocalFolder } from "./LocalFile";

// Custom error types for clarity
export class MissingApiKeyError extends Error { }
export class InvalidApiKeyError extends Error { }

export const img_models = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview"
]

export class GoogleAI {
  public static options = {
    img_models: {
      flash_image: "gemini-2.5-flash-image",
      pro_image: "gemini-3-pro-image-preview"
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

  public static async txt2txt(prompt: string) {
    try {
      const genAI = this.getGenAI();

      const config: any = {};

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config,
      });

      console.log("RES TEXT", response.text);
      return response.text; // fallback to raw text if no schema

    } catch (err: any) {
      console.error("Goo Err Response", err);

      // Detect missing or invalid API key
      const message = err?.message || "";
      if (message.includes("API key not valid") || message.includes("API_KEY_INVALID") || err instanceof MissingApiKeyError) {
        this.showKeyPromptWindow()
        return null;
      }

      // Rethrow any other unexpected errors
      throw err;
    }
  }

  // ---------- img2img function ----------
  public static async img2img(
    prompt: string,
    model: string = img_models[0],
    images?: { rawBase64: string; mime: string; description: string }[]
  ) {
    try {
      const genAI = this.getGenAI();

      // Prepare contents array
      const contents: any[] = [{ text: prompt }];

      if (images?.length) {
        for (const img of images) {
          if (!img?.rawBase64 || !img?.mime) continue;
          if (img.description) contents.push({ text: img.description });
          contents.push({ inlineData: { data: img.rawBase64, mimeType: img.mime }, });
        }
      }

      const payload = {
        model: model,
        contents,
        config: {
          imageConfig: {
            aspectRatio: "9:16",
            response_modalities: ["Image"],
          },
        },
      };

      console.log("Gemini Payload", payload);

      const response = await genAI.models.generateContent(payload);
      console.log("GEMINI RES", response);

      // Iterate response parts
      const candidates = response?.candidates ?? [];
      const parts = candidates[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mime = part.inlineData.mimeType || "image/png";
          return {
            base64Obj: { rawBase64: base64, mime },
            id: response.responseId,
          };
        }
      }

      // If no image returned, fallback
      return null;
    } catch (err: any) {
      // Detect missing or invalid API key
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
}


export type AIImageInput = {
  rawBase64: string;
  mime: string;
  description: string;
};