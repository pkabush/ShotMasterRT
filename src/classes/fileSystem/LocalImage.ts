import { LocalMedia } from './LocalMedia';
import type { LocalFolder } from './LocalFolder';
import { runInAction } from 'mobx';

// LocalImage.ts
export class LocalImage extends LocalMedia {
  base64Data: { rawBase64: string; mime: string } | null = null; // cache for Base64 + MIME

  // Returns Base64 string and MIME, caching it
  async getBase64(): Promise<{ rawBase64: string; mime: string }> {
    if (this.base64Data) return this.base64Data;

    try {
      const file = await this.getFile();
      const arrayBuffer = await file.arrayBuffer();
      const mime = file.type || "image/png";
      const rawBase64 = arrayBufferToBase64(arrayBuffer);

      this.base64Data = { rawBase64, mime };
      return this.base64Data;
    } catch (err) {
      console.error("Failed to create Base64 from file:", err);
      return { rawBase64: "", mime: "image/png" };
    }
  }

  async getAIImage() {
    const base64Obj = await this.getBase64();
    return {
      rawBase64: base64Obj.rawBase64,
      mime: base64Obj.mime,
      description: this.path,
    };
  }

  // **New static factory from Base64 string**
  static async fromBase64(
    base64Obj: { rawBase64: string; mime: string },
    folder: LocalFolder,
    filename: string
  ): Promise<LocalImage> {
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

      // Return LocalImage with cached base64Data
      const image = new LocalImage(folder, fileHandle);
      image.base64Data = base64Obj; // cache
      await image.load();
      return image;
    } catch (err) {
      console.error("Failed to create LocalImage from Base64:", err);
      throw err;
    }
  }

  private _imageMetaPromise: Promise<void> | null = null;

  async ensureImageMetaLoaded() {
    if (this._width && this._height ) return;
    if (this._imageMetaPromise) return this._imageMetaPromise;

    this._imageMetaPromise = (async () => {
      try {
        const url = await this.getUrlObject();

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.src = url;

          img.onload = () => {
            runInAction(() => {
              this._width = img.naturalWidth || 100;
              this._height = img.naturalHeight || 100;
            });
            resolve();
          };

          img.onerror = reject;
        });

      } catch (err) {
        console.error("Failed to load image metadata:", err);
      } finally {
        this._imageMetaPromise = null;
      }
    })();

    return this._imageMetaPromise;
  }


  async getUrlObject(): Promise<string> {
    const url = await super.getUrlObject();
    this.ensureImageMetaLoaded(); // fire and forget (like video)
    return url;
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