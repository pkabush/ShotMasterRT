// classes/GoogleGenAI.ts
import { LocalImage } from "./fileSystem/LocalImage";
import type { LocalFolder } from "./fileSystem/LocalFolder";
import type { AIGenerateParms, AIImageInput, AIProvider, AIResult, ImageResult } from "./AI_provider";
import { postToWorker } from "./CloudflareWorker/WorkerUtils";
import { LocalVideo } from "./fileSystem/LocalVideo";
import { base64ToBlob } from "./ChatGPT";

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
    resolution: {
      "none": "none",
      "0.5K": "0.5K",
      "1K": "1K",
      "2K": "2K",
      "4K": "4K",
    },
    text_models: {
      gemini_3_1_flash_lite: "gemini-3.1-flash-lite",
      gemini_3_1_pro_preview: "gemini-3.1-pro-preview",
      gemini_3_flash_preview: "gemini-3-flash-preview",
    },
    audio_generation: {
      voices: [
        "Kore",
        "Puck",
        "Ludo",
        "Brio",
        "Jori",
        "Enzo",
        "Arlo",
        "Flinn",
        "Sulafat",
        "Nika",
        "Sami",
        "Gacrux",
      ],
      models: [
        "gemini-3.8-flash-tts",
      ],
    }
  }

  private static async postToGemini(payload: any) {
    try {
      console.log("Gemini Payload", payload);
      const response = await postToWorker(payload, "gemini/generate");
      console.log("GEMINI RES", response);
      return response;

    } catch (err) {
      console.error("Gemini worker error", err);
      throw err;
    }
  }

  private static parseResponse(response: any) {
    const parts = response?.candidates?.[0]?.content?.parts ?? [];

    // Look for image first
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

    // Otherwise return text
    for (const part of parts) {
      if (part.text) {
        return part.text;
      }
    }

    return null;
  }


  // ---------- img2img function ----------
  public static async img2img(
    prompt?: string,
    model: string = GoogleAI.options.img_models.flash_image,
    images?: AIImageInput[],
    aspect_ratio?: string,
    resolution?: string,
  ) {
    try {
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

        config.imageConfig = {
          ...(aspect_ratio && aspect_ratio !== "none" ? { aspectRatio: aspect_ratio } : {}),
          ...(resolution && resolution !== "none" ? { imageSize: resolution } : {}),
        };
      }
      const payload = {
        model,
        contents,
        config,
      };

      const response = await GoogleAI.postToGemini(payload);
      return GoogleAI.parseResponse(response);

    } catch (err: any) {
      console.error("img2img error", err);
      throw err;
    }
  }

  public static async saveResultImage(result: any, folder: LocalFolder) {
    if (result && result.base64Obj?.rawBase64) {
      //console.log(result.base64Obj.mime.split("/")[1]);
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
    const messages: AIMessage[] = [];

    if (params.prompt) {
      messages.push(params.prompt);
    }

    if (params.images?.length) {
      messages.push(...params.images);
    }

    console.log("Gathered Messages", messages);
    const res = await GoogleAI.sendMessages(messages, params.model);

    /*const res = await GoogleAI.img2img(
      params.prompt,
      params.model,
      params.images,
    );*/
    if (!res) return null;
    return res as string;
  }

  async generateImage(params: AIGenerateParms): Promise<ImageResult | null> {
    const messages: AIMessage[] = [];
    if (params.prompt) { messages.push(params.prompt); }
    if (params.images?.length) { messages.push(...params.images); }
    const res = await GoogleAI.sendMessages(messages, params.model, params.aspect_ratio, params.resolution);

    /*
    const res = await GoogleAI.img2img(
      params.prompt,
      params.model,
      params.images,
      params.aspect_ratio,
      params.resolution,
    );
    */
    if (!res) return null;
    return res as ImageResult;
  }

  // ---------- img2img function ----------

  async sendMessages(
    messages: AIMessage[],
    model: string,
    aspect_ratio?: string,
    resolution?: string,
  ): Promise<AIResult | null> {
    return GoogleAI.sendMessages(
      messages,
      model,
      aspect_ratio,
      resolution,
    );
  }


  public static async sendMessages(
    messages: AIMessage[],
    model: string = GoogleAI.options.img_models.flash_image,
    aspect_ratio?: string,
    resolution?: string,
  ) {
    try {
      const contents: any[] = [];

      for (const message of messages) {

        // Plain string
        if (typeof message === "string") {
          if (message.trim()) {
            contents.push({
              text: message,
            });
          }
          continue;
        }

        // Local Video
        if (message instanceof LocalVideo) {
          console.log("Local Video Message", message);
          const gfile_part = await message.getGoogleFileURL()
          console.log("GFile Message part", gfile_part)
          contents.push(gfile_part);
          continue;
        }

        // Local Image
        if (message instanceof LocalImage) {
          // Upload To Google FILES Api
          /*
          const gfile_part = await message.getGoogleFileURL()
          console.log("GFile Message part", gfile_part)
          contents.push(gfile_part);
          */


          const image = await message.getAIImage()
          contents.push({
            inlineData: {
              data: image.rawBase64,
              mimeType: image.mime,
            },
          });

          continue;
        }

        // Raw image object
        if ("rawBase64" in message && "mime" in message) {
          contents.push({
            inlineData: {
              data: message.rawBase64,
              mimeType: message.mime,
            },
          });
          continue;
        }
      }

      // Generate Payload
      const isImageModel = Object.values(GoogleAI.options.img_models).includes(model);
      const config: any = {};

      if (isImageModel) {
        config.response_modalities = ["Image"];

        config.imageConfig = {
          ...(aspect_ratio && aspect_ratio !== "none"
            ? { aspectRatio: aspect_ratio }
            : {}),
          ...(resolution && resolution !== "none"
            ? { imageSize: resolution }
            : {}),
        };
      }

      const payload = {
        model,
        contents,
        config,
      };

      const response = await GoogleAI.postToGemini(payload);
      return GoogleAI.parseResponse(response);

    } catch (err: any) {
      console.error("img2img error", err);
      throw err;
    }
  }



  public static async generateAudio(
    lines: AudioLine[],
    model: string = "gemini-3.8-flash-tts",
  ): Promise<Blob | null> {
    try {
      if (!lines.length) {
        throw new Error("No audio lines provided");
      }

      const speakers = Array.from(
        new Set(lines.map((line) => line.speaker)),
      );

      const isMultiSpeaker = speakers.length > 1;

      const parts = lines.map((line) => ({
        text: line.text,
        ...(isMultiSpeaker
          ? {
            speech_metadata: {
              speaker: line.speaker,
              ...(line.style ? { style: line.style } : {}),
            },
          }
          : line.style
            ? {
              speech_metadata: {
                style: line.style,
              },
            }
            : {}),
      }));

      let speechConfig;

      if (!isMultiSpeaker) {
        // Preserve the previous single-speaker implementation.
        speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: lines[0].voice,
            },
          },
        };
      } else {
        // Multi-speaker configuration.
        const speakerVoiceConfigs = Array.from(
          new Map(
            lines.map((line) => [
              line.speaker,
              {
                speaker: line.speaker,
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: line.voice,
                  },
                },
              },
            ]),
          ).values(),
        );

        speechConfig = {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs,
          },
        };
      }

      const payload = {
        contents: [
          {
            role: "user",
            parts,
          },
        ],

        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig,
        },
      };

      console.log("Gemini Audio Payload:", payload,);

      const response = await postToWorker(
        payload,
        "gemini/generate-audio",
        { model },
      );

      console.log("Gemini Audio Response:", response);

      const audioPart =
        response?.candidates?.[0]?.content?.parts?.find(
          (part: any) => part?.inlineData?.data,
        );

      if (!audioPart?.inlineData?.data) {
        throw new Error("Gemini returned no audio data");
      }

      const base64 = audioPart.inlineData.data;
      const mimeType =
        audioPart.inlineData.mimeType || "audio/wav";

      return base64ToBlob(base64, mimeType);
    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log("INPUT GEMINI KEY!");
        return null;
      }

      console.error("Gemini generateAudio error", err);
      throw err;
    }
  }




}


export type AIMessage =
  | string
  | AIImageInput
  | LocalVideo
  | LocalImage;


export type AudioLine = {
  speaker: string;
  text: string;
  voice: string;
  style?: string;
};