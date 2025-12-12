export {};

declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    queryPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
    requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
    queryPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
    requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | Blob | string): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
    close(): Promise<void>;
  }
}