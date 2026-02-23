import { LocalMedia } from './LocalMedia';
import type { LocalFolder } from './LocalFile';

// LocalVideo.ts
export class LocalVideo extends LocalMedia {

  // Optional: create from Base64 (rare for videos, but possible)
  static async fromBase64(
    base64Data: string,
    //mime: string,
    folder: LocalFolder,
    filename: string
  ): Promise<LocalVideo> {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const fileHandle = await folder.handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(bytes);
      await writable.close();

      return new LocalVideo(fileHandle, folder);
    } catch (err) {
      console.error('Failed to create LocalVideo from Base64:', err);
      throw err;
    }
  }
}
