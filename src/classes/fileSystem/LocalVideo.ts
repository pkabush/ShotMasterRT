import { LocalMedia } from './LocalMedia';
import type { LocalFolder } from './LocalFolder';
import { arrayBufferToBase64 } from './LocalImage';
import { runInAction, makeObservable, observable, action } from 'mobx';


export interface LocalVideoPreview {
  time: number;
  blob: Blob;
  url: string;
}

// LocalVideo.ts
export class LocalVideo extends LocalMedia {
  base64Data: { rawBase64: string; mime: string } | null = null; // cache for Base64 + MIME

  // In-memory video previews
  previewFrames: LocalVideoPreview[] = [];

  constructor(
    parentFolder: LocalFolder,
    handle: FileSystemFileHandle
  ) {
    super(parentFolder, handle);

    makeObservable(this, {
      previewFrames: observable.ref,
      clearPreviews: action,
      removePreview: action,
    });
  }

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

  async getBase64(): Promise<{ rawBase64: string; mime: string }> {
    if (this.base64Data) return this.base64Data;

    try {
      const file = await this.getFile();
      const arrayBuffer = await file.arrayBuffer();
      const mime = file.type;
      const rawBase64 = arrayBufferToBase64(arrayBuffer);

      this.base64Data = { rawBase64, mime };
      return this.base64Data;
    } catch (err) {
      console.error("Failed to create Base64 from file:", err);
      return { rawBase64: "", mime: "image/png" };
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

  // PROCESSING PREVIEWS

  async extractPreviews(
    interval: number = 1
  ): Promise<void> {

    console.log("Extracting Previews", interval);
    await this.ensureDurationLoaded();

    const url = await this.getUrlObject();

    if (!this._duration) { throw new Error("Video duration is not available."); }

    // Remove previews from a previous extraction
    this.clearPreviews();

    const video =
      document.createElement("video");

    video.preload = "auto";
    video.src = url;

    await new Promise<void>((resolve, reject) => {

      video.onloadedmetadata = () => resolve();

      video.onerror = () => {
        reject(
          new Error("Could not load video.")
        );
      };

    });

    const frames: LocalVideoPreview[] = [];

    try {

      for (
        let time = 0;
        time < video.duration;
        time += interval
      ) {

        await this.seekVideo(
          video,
          time
        );

        const blob =
          await this.captureVideoFrame(video);

        const preview: LocalVideoPreview = {
          time,
          blob,
          url: URL.createObjectURL(blob),
        };

        frames.push(preview);
        console.log("Extracted Frame at", time);

        // Update MobX progressively so the UI
        // can display frames as they are generated.
        runInAction(() => {
          this.previewFrames = [...frames];
        });
      }

    } finally {
      video.remove();
    }
  }

  clearPreviews() {

    for (
      const preview of this.previewFrames
    ) {

      URL.revokeObjectURL(
        preview.url
      );
    }

    this.previewFrames = [];
  }

  private async seekVideo(
    video: HTMLVideoElement,
    time: number
  ): Promise<void> {

    return new Promise(
      (resolve, reject) => {

        const onSeeked = () => {

          cleanup();

          resolve();
        };

        const onError = () => {

          cleanup();

          reject(
            new Error(
              "Video seek failed."
            )
          );
        };

        const cleanup = () => {

          video.removeEventListener(
            "seeked",
            onSeeked
          );

          video.removeEventListener(
            "error",
            onError
          );
        };

        video.addEventListener(
          "seeked",
          onSeeked,
          { once: true }
        );

        video.addEventListener(
          "error",
          onError,
          { once: true }
        );

        video.currentTime = time;
      }
    );
  }

  private async captureVideoFrame(
    video: HTMLVideoElement
  ): Promise<Blob> {

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {

      throw new Error(
        "Video frame is not ready."
      );
    }

    const canvas =
      document.createElement("canvas");

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "Could not create canvas context."
      );
    }

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob =
      await new Promise<Blob | null>(
        resolve => {

          canvas.toBlob(
            resolve,
            "image/png"
          );
        }
      );

    if (!blob) {
      throw new Error(
        "Could not create image blob."
      );
    }

    return blob;
  }

  async createPreviewStrip(): Promise<Blob> {
    if (this.previewFrames.length === 0) {
      throw new Error("No preview frames available.");
    }

    const images = await Promise.all(
      this.previewFrames.map((preview) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();

          img.onload = () => resolve(img);
          img.onerror = () =>
            reject(new Error(`Failed to load preview at ${preview.time}s`));

          img.src = preview.url;
        });
      })
    );

    // Use the first image's height as the strip height.
    const height = images[0].naturalHeight;

    // Scale every image to the same height.
    const widths = images.map(
      (img) => (img.naturalWidth / img.naturalHeight) * height
    );

    const width = Math.round(
      widths.reduce((sum, w) => sum + w, 0)
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas context.");
    }

    let x = 0;

    images.forEach((img, index) => {
      const frameWidth = Math.round(widths[index]);

      ctx.drawImage(
        img,
        x,
        0,
        frameWidth,
        height
      );

      x += frameWidth;
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.9
      );
    });

    if (!blob) {
      throw new Error("Could not create preview strip.");
    }

    return blob;
  }

  removePreview(preview: LocalVideoPreview): void {
    URL.revokeObjectURL(preview.url);

    this.previewFrames = this.previewFrames.filter(
      (frame) => frame !== preview
    );
  }
}


