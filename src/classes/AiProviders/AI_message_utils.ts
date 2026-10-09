import { LocalImage } from "../fileSystem/LocalImage";
import type { LocalVideo } from "../fileSystem/LocalVideo";


export type AIImageInput = {
  rawBase64: string;
  mime: string;
  description: string;
};

export type AIVideoInput = {
  rawBase64: string;
  mime: string;
  description?: string;
};

export type AIMessage =
  | string
  | AIImageInput
  | LocalVideo
  | LocalImage;



function messagesToJoinedPrompt(
  messages: AIMessage[]
): string {
  return messages
    .filter((message): message is string => typeof message === "string")
    .filter((message) => message.trim().length > 0)
    .join("\n\n");
}

function messagesToLocalImages(
  messages: AIMessage[]
): LocalImage[] {
  return messages.filter((message): message is LocalImage => message instanceof LocalImage);
}



async function downloadImageAsBase64(url: string): Promise<{
  rawBase64: string;
  mime: string;
}> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Avoid exceeding argument limits for large images.
  let binary = "";
  const chunkSize = 8192;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return {
    rawBase64: btoa(binary),
    mime: blob.type || "image/png",
  };
}

function generateImageName(
  model: string,
  action: "generate" | "edit"
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${model}-${action}-${timestamp}`;
}

const AI_Utils = {
  messagesToJoinedPrompt,
  messagesToLocalImages,
  downloadImageAsBase64,
  generateImageName,
};

export default AI_Utils;

