// src/userSettingsDb.ts
import { openDB } from "idb";

export const USER_DB = "ShotMasterRE";
export const USER_STORE = "settings";

export async function getUserDB() {
  return openDB(USER_DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(USER_STORE)) {
        db.createObjectStore(USER_STORE, { keyPath: "id" });
      }
    },
  });
}
