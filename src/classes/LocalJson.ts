import { makeAutoObservable, observable, runInAction } from "mobx";

export class LocalJson {
  fileHandle: FileSystemFileHandle;
  data: Record<string, any>;

  private constructor(fileHandle: FileSystemFileHandle, data: Record<string, any>) {
    this.fileHandle = fileHandle;
    this.data = observable(data); // <-- make data observable
    makeAutoObservable(this);      // <-- make this instance observable
  }

  static async create(
    folderHandle: FileSystemDirectoryHandle, 
    filename: string, 
    defaultData: Record<string, any> = {}
  ): Promise<LocalJson> {
    try {
      const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = text.trim() === '' 
        ? { ...defaultData } 
        : { ...defaultData, ...JSON.parse(text) };
      return new LocalJson(fileHandle, data);
    } catch (err) {
      console.error('Error loading JSON:', err);
      const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
      return new LocalJson(fileHandle,  { ...defaultData} );
    }
  }

  async save(): Promise<void> {
    try {
      let permission = await this.fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        permission = await this.fileHandle.requestPermission({ mode: 'readwrite' });
      }
      if (permission !== 'granted') throw new Error('No permission to write file');

      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(this.data, null, 2));
      await writable.close();
    } catch (err) {
      console.error('Error saving JSON:', err);
    }
  }

  async updateField(field: string, value: any, save:boolean = true): Promise<void> {
    runInAction(() => {
      this.data[field] = value; // now observable
    });
    if (save) await this.save();
  }
}
