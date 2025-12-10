export class LocalJson {
  fileHandle: FileSystemFileHandle;
  data: Record<string, any> = {};

  private constructor(fileHandle: FileSystemFileHandle, data: Record<string, any>) {
    this.fileHandle = fileHandle;
    this.data = data;
  }

  // Factory method to create a LocalJson instance and load data
  static async create(folderHandle: FileSystemDirectoryHandle, filename: string): Promise<LocalJson> {
    try {
      const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = text.trim() === '' ? {} : JSON.parse(text);
      return new LocalJson(fileHandle, data);
    } catch (err) {
      console.error('Error loading JSON:', err);
      // return empty LocalJson with dummy handle (unlikely to happen in normal flow)
      const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
      return new LocalJson(fileHandle, {});
    }
  }

  // Save current data back to file
  async save(): Promise<void> {
    try {
      let permission = await this.fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        permission = await this.fileHandle.requestPermission({ mode: 'readwrite' });
      }
      if (permission !== 'granted') {
        throw new Error('No permission to write file');
      }

      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(this.data, null, 2));
      await writable.close();
    } catch (err) {
      console.error('Error saving JSON:', err);
    }
  }

  // Update a single field and save
  async updateField(field: string, value: any): Promise<void> {
    this.data[field] = value;
    await this.save();
  }
}
