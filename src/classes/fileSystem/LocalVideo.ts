import { LocalMedia } from './LocalMedia';
import type { LocalFolder } from './LocalFolder';
import { runInAction } from 'mobx';

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

      return new LocalVideo(folder, fileHandle);
    } catch (err) {
      console.error('Failed to create LocalVideo from Base64:', err);
      throw err;
    }
  }


  private _durationPromise: Promise<void> | null = null;

  async ensureDurationLoaded() {
    if (this._duration !== null) return;
    if (this._durationPromise) return this._durationPromise;

    this._durationPromise = (async () => {
      try {
        const url = await this.getUrlObject();

        await new Promise<void>((resolve, reject) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = url;

          video.onloadedmetadata = () => {
            runInAction(() => {
              this._duration = video.duration;
              this._width = video.videoWidth || 100;
              this._height = video.videoHeight || 100;
            });
            video.remove();
            resolve();
          };

          video.onerror = reject;
        });

      } catch (err) {
        console.error("Failed to load duration:", err);
      } finally {
        this._durationPromise = null;
      }
    })();

    return this._durationPromise;
  }

  async getUrlObject(): Promise<string> {
    const url = await super.getUrlObject();
    this.ensureDurationLoaded(); // fire and forget
    return url;
  }

}
