import { ChatGPT } from "./ChatGPT";
import { GoogleAI } from "./GoogleAI";

export const ai_providers = {
    KLING: "kling",
    GPT: "gpt",
    GOOGLE: "google",
};

export type AIImageInput = {
    rawBase64: string;
    mime: string;
    description: string;
};

export type AIGenerateParms = {
    prompt?: string;
    system?: string;
    images?: AIImageInput[];
    model: string;
    aspect_ratio?: string;
};

export type ImageResult = {
    base64Obj: {
        rawBase64: string;
        mime: string;
    };
    id?: string;
};

const googleTextModels = new Set(Object.values(GoogleAI.options.text_models));
const googleImageModels = new Set(Object.values(GoogleAI.options.img_models));
const chatgptModels = new Set(Object.values(ChatGPT.options.models));

export const AllTextModels = [
  ...googleTextModels,
  ...chatgptModels
];

export const AllImageModels = [
  ...googleImageModels,
  ...chatgptModels
];

export function resolveModel(model: string): AIProvider | null {
  if (googleTextModels.has(model)) return new GoogleAI();
  if (googleImageModels.has(model)) return new GoogleAI();
  if (chatgptModels.has(model)) return new ChatGPT();
  return null;
}
export type AIResult = string | ImageResult;

export interface AIProvider {
  generateText(params: AIGenerateParms): Promise<string | null>;
  generateImage(params: AIGenerateParms): Promise<ImageResult | null>;
}


export class AI {   

  public static async GenerateText(params: AIGenerateParms): Promise<string | null> {
    const provider: AIProvider | null = resolveModel(params.model);
    if (!provider) {
      throw new Error(`No AI provider found for model: ${params.model}`);
    }

    return provider.generateText(params);
  }

  public static async GenerateImage(params: AIGenerateParms): Promise<ImageResult | null> {
    const provider: AIProvider | null = resolveModel(params.model);
    if (!provider) {
      throw new Error(`No AI provider found for model: ${params.model}`);
    }
    return provider.generateImage(params);
  }
}

