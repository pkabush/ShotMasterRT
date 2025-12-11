// LocalImage.ts
export class LocalImage {
  handle: FileSystemFileHandle;
  urlObject: string | null = null;

  constructor(handle: FileSystemFileHandle) {
    this.handle = handle;
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
      return new LocalImage(fileHandle);
    } catch (err) {
      console.error('Failed to create LocalImage from URL:', err);
      throw err;
    }
  }

  async delete(parentDir: FileSystemDirectoryHandle): Promise<void> {
    try {
      // Revoke URL if created
      this.revokeUrl();

      // Remove the file from the directory
      await parentDir.removeEntry(this.handle.name);

    } catch (err) {
      console.error('Failed to delete image file:', err);
      throw err;
    }
  }

}
