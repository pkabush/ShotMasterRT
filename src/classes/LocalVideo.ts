// LocalVideo.ts
export class LocalVideo {
  handle: FileSystemFileHandle;
  parent: FileSystemDirectoryHandle;
  urlObject: string | null = null;

  constructor(handle: FileSystemFileHandle, parent: FileSystemDirectoryHandle) {
    this.handle = handle;
    this.parent = parent;
  }

  // Returns a temporary object URL for video playback
  async getUrlObject(): Promise<string> {
    if (!this.urlObject) {
      try {
        const file = await this.handle.getFile();
        this.urlObject = URL.createObjectURL(file);
      } catch (err) {
        console.error('Failed to create object URL for video:', err);
        this.urlObject = '';
      }
    }
    return this.urlObject;
  }

  // Cleanup object URL
  revokeUrl(): void {
    if (this.urlObject) {
      URL.revokeObjectURL(this.urlObject);
      this.urlObject = null;
    }
  }

  // Create a LocalVideo from a URL
  static async fromUrl(url: string, folder: FileSystemDirectoryHandle): Promise<LocalVideo> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

      const blob = await response.blob();

      // Extract filename from URL (remove query params)
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1].split("?")[0];

      // Create file handle and write blob
      const fileHandle = await folder.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      return new LocalVideo(fileHandle, folder);
    } catch (err) {
      console.error('Failed to create LocalVideo from URL:', err);
      throw err;
    }
  }

  // Delete video from folder
  async delete(): Promise<void> {
    try {
      this.revokeUrl();
      await this.parent.removeEntry(this.handle.name);
    } catch (err) {
      console.error('Failed to delete video file:', err);
      throw err;
    }
  }

  // Optional: create from Base64 (rare for videos, but possible)
  static async fromBase64(
    base64Data: string,
    //mime: string,
    folder: FileSystemDirectoryHandle,
    filename: string
  ): Promise<LocalVideo> {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const fileHandle = await folder.getFileHandle(filename, { create: true });
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
