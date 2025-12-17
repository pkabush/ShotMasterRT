// classes/GoogleGenAI.ts
import { GoogleGenAI as GoogleSDK } from "@google/genai";

// Custom error types for clarity
export class MissingApiKeyError extends Error {}
export class InvalidApiKeyError extends Error {}

export class GoogleAI {
  private static client: GoogleSDK | null = null;

  // Functions to get/set API key dynamically
  public static getApiKey: (() => string | null) | null = null;
  public static setApiKey: ((key: string) => void) | null = null;

  private static getGenAI() {
    if (!this.client) {
      const key = this.getApiKey?.() || "";
      if (!key) throw new MissingApiKeyError("No Google API key set");
      this.client = new GoogleSDK({ apiKey: key });
    }
    return this.client;
  }

  public static resetClient() {
    this.client = null;
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

      console.log("RES TEXT",response.text);
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
    images?: { rawBase64: string; mime: string }[]
  ) {
    try {
      const genAI = this.getGenAI();

      // Prepare contents array
      const contents: any[] = [{ text: prompt }];

      if (images?.length) {
        for (const img of images) {
          if (!img?.rawBase64 || !img?.mime) continue;
          contents.push({
            inlineData: { data: img.rawBase64, mimeType: img.mime },
          });
        }
      }

      const payload = {
        model: "gemini-2.5-flash-image",
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
      this.resetClient();
    } else {
      console.warn("User did not provide a valid API key.");
    }
  }
}
