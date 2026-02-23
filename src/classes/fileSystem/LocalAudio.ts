import { LocalMedia } from './LocalMedia';
import type { LocalFolder } from './LocalFile';

// LocalAudio.ts
export class LocalAudio extends LocalMedia {
  base64Data: { rawBase64: string; mime: string } | null = null; // cache for Base64 + MIME

  // Returns Base64 string and MIME, caching it
  async getBase64(): Promise<{ rawBase64: string; mime: string }> {
    if (this.base64Data) return this.base64Data;

    try {
      const file = await this.getFile();
      const arrayBuffer = await file.arrayBuffer();
      const mime = file.type || "audio/mpeg"; // default to mp3
      const rawBase64 = arrayBufferToBase64(arrayBuffer);

      this.base64Data = { rawBase64, mime };
      return this.base64Data;
    } catch (err) {
      console.error("Failed to create Base64 from audio file:", err);
      return { rawBase64: "", mime: "audio/mpeg" };
    }
  }

  // Static factory to create LocalAudio from Base64 string
  static async fromBase64(
    base64Obj: { rawBase64: string; mime: string },
    folder: LocalFolder,
    filename: string
  ): Promise<LocalAudio> {
    try {
      // Strip "data:mime;base64," prefix if present
      let rawBase64 = base64Obj.rawBase64;
      const prefix = `data:${base64Obj.mime};base64,`;
      if (rawBase64.startsWith(prefix)) {
        rawBase64 = rawBase64.slice(prefix.length);
      }

      // Convert Base64 to Uint8Array
      const binaryString = atob(rawBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create file in folder
      const fileHandle = await folder.handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(bytes);
      await writable.close();

      // Return LocalAudio with cached base64Data
      const audio = new LocalAudio(fileHandle, folder);
      audio.base64Data = base64Obj; // cache
      return audio;
    } catch (err) {
      console.error("Failed to create LocalAudio from Base64:", err);
      throw err;
    }
  }

    async getDuration(): Promise<number> {
    const file = await this.getFile();
    const objectUrl = URL.createObjectURL(file);

    return await new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = objectUrl;
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio'));
      });
    });
  }
}

// Utility
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
