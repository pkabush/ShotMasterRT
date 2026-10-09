import type { AIGenerateParms, AIProvider, AIResult, ImageResult } from "../AI_provider";
import { ChatGPT } from "../ChatGPT";
import { GoogleAI } from "../GoogleAI";
import { SeedanceAI } from "./Byteplus";

import type { AIMessage } from "./AI_message_utils";


const googleTextModels = new Set(Object.values(GoogleAI.options.text_models));
const googleImageModels = new Set(Object.values(GoogleAI.options.img_models));
const chatgptTextModels = new Set(Object.values(ChatGPT.options.models));
const chatgptImageModels = new Set(Object.values(ChatGPT.options.image_models));
const seedanceImageModels = new Set(SeedanceAI.options.image_models);

export const AllTextModels = [
  ...googleTextModels,
  ...chatgptTextModels
];

export const AllImageModels = [
  ...googleImageModels,
  ...chatgptImageModels,
  ...seedanceImageModels
];



export function resolveModel(model: string): AIProvider | null {
  if (googleTextModels.has(model)) return new GoogleAI();
  if (googleImageModels.has(model)) return new GoogleAI();
  if (chatgptTextModels.has(model)) return new ChatGPT();
  if (chatgptImageModels.has(model)) return new ChatGPT();
  if (seedanceImageModels.has(model)) return new SeedanceAI();
  return null;
}


export class AI {

  public static async GenerateText(params: AIGenerateParms): Promise<string | null> {
    const provider: AIProvider | null = resolveModel(params.model ?? AllTextModels[0]);
    if (!provider) {
      throw new Error(`No AI provider found for model: ${params.model}`);
    }

    return provider.generateText(params);
  }

  public static async GenerateImage(params: AIGenerateParms): Promise<ImageResult | null> {
    const provider: AIProvider | null = resolveModel(params.model ?? AllImageModels[0]);
    if (!provider) {
      throw new Error(`No AI provider found for model: ${params.model}`);
    }
    return provider.generateImage(params);
  }

  public static async sendMessages(
    messages: AIMessage[],
    model?: string,
    aspect_ratio?: string,
    resolution?: string,
    generateImage?: boolean,
  ): Promise<AIResult | null> {

    const resolvedModel = model ?? (generateImage ? AllImageModels[0] : AllTextModels[0]);
    const provider = resolveModel(resolvedModel);

    if (!provider) {
      throw new Error(`No AI provider found for model: ${model}`);
    }

    return provider.sendMessages(
      messages,
      resolvedModel,
      aspect_ratio,
      resolution,
    );
  }
}