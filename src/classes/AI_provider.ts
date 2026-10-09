import type { LocalImage } from "./fileSystem/LocalImage";
import type { AIImageInput, AIMessage } from "./AiProviders/AI_message_utils";

export const ai_providers = {
  KLING: "kling",
  GPT: "gpt",
  GOOGLE: "google",
  BD: 'bytedance',
};



export type AIGenerateParms = {
  prompt?: string;
  system?: string;
  images?: AIImageInput[] | LocalImage[];
  model?: string;
  aspect_ratio?: string;
  resolution?: string;
};

export type ImageResult = {
  base64Obj: {
    rawBase64: string;
    mime: string;
  };
  id?: string;
};


export type AIResult = string | ImageResult;

export interface AIProvider {
  generateText(params: AIGenerateParms): Promise<string | null>;
  generateImage(params: AIGenerateParms): Promise<ImageResult | null>;
  sendMessages(
    messages: AIMessage[],
    model: string,
    aspect_ratio?: string,
    resolution?: string,
  ): Promise<AIResult | null>;
}




