import type { LocalMedia } from "./interfaces/LocalMedia";

// LocalImage.ts
export class LocalImage implements LocalMedia{
  handle: FileSystemFileHandle;
  parent: FileSystemDirectoryHandle;
  urlObject: string | null = null;
  base64Data: { rawBase64: string; mime: string } | null = null; // cache for Base64 + MIME
  path: string = "";

  constructor(handle: FileSystemFileHandle,parent: FileSystemDirectoryHandle, parent_path :string = "") {
    this.handle = handle;
    this.parent = parent;
    this.path = parent_path + "/" + handle.name;
  }

  // Returns the object URL, creating it if needed
  async getUrlObject(): Promise<string> {
    if (!this.urlObject) {
      try {
        const file = await this.handle.getFile();
        this.urlObject = URL.createObjectURL(file);
      } catch (err) {
        console.error('Failed to create object URL for file:', err);
        this.urlObject = '';
      }
    }
    return this.urlObject;
  }

  // Optional: cleanup object URL
  revokeUrl(): void {
    if (this.urlObject) {
      URL.revokeObjectURL(this.urlObject);
      this.urlObject = null;
    }
  }

  static async fromUrl(url: string, folder: FileSystemDirectoryHandle): Promise<LocalImage> {
    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

      const blob = await response.blob();

      // Determine a filename from the URL
      const urlParts = url.split('/');
      let filename = urlParts[urlParts.length - 1];

      // Create a file handle in the folder
      const fileHandle = await folder.getFileHandle(filename, { create: true });

      // Write the blob to the file
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      // Return new LocalImage instance
      return new LocalImage(fileHandle,folder);
    } catch (err) {
      console.error('Failed to create LocalImage from URL:', err);
      throw err;
    }
  }

  async delete(): Promise<void> {
    try {
      // Revoke URL if created
      this.revokeUrl();

      // Remove the file from the directory
      await this.parent.removeEntry(this.handle.name);

    } catch (err) {
      console.error('Failed to delete image file:', err);
      throw err;
    }
  }

  // Returns Base64 string and MIME, caching it
  async getBase64(): Promise<{ rawBase64: string; mime: string }> {
    if (this.base64Data) return this.base64Data;

    try {
      const file = await this.handle.getFile();
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

    // **New static factory from Base64 string**
  static async fromBase64(
    base64Obj: { rawBase64: string; mime: string },
    folder: FileSystemDirectoryHandle,
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
      const fileHandle = await folder.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(bytes);
      await writable.close();

      // Return LocalImage with cached base64Data
      const image = new LocalImage(fileHandle,folder);
      image.base64Data = base64Obj; // cache
      return image;
    } catch (err) {
      console.error("Failed to create LocalImage from Base64:", err);
      throw err;
    }
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