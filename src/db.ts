// src/db.ts
import { openDB } from 'idb';

const DB_NAME = 'app-db';
const DB_VERSION = 1;
const STORE_NAME = 'folders';

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    },
  });
}

export async function savePickedFolder(handle: FileSystemDirectoryHandle) {
  const db = await getDB();
  await db.put(STORE_NAME, { name: handle.name, handle });
}

export async function loadRecentFolders(): Promise<FileSystemDirectoryHandle[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  // return latest 5
  return all.slice(-5).map(item => item.handle);
}
