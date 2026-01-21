// LocalMediaInterface.ts
export interface LocalMedia {
  handle: FileSystemFileHandle;
  parent: FileSystemDirectoryHandle;
  path: string;

  // Deletes the media from storage
  delete(): Promise<void>;
}
