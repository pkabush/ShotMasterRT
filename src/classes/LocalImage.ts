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
}
