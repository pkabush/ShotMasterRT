// classes/UserSettingsDB.ts
import { openDB } from "idb";
import type {IDBPDatabase} from "idb";
import { makeAutoObservable, runInAction, toJS } from "mobx";

export interface UserSettings {
  id: "settings";
  lastOpenedFolder: FileSystemDirectoryHandle | null;
  recentFolders: FileSystemDirectoryHandle[];
  api_keys: Record<string, string>;
}

const DB_NAME = "ShotMasterRE";
const STORE = "settings";

export class UserSettingsDB {
  // Store the resolved DB instance, not a promise
  private db: IDBPDatabase<UserSettings> | null = null;

  data: UserSettings = {
    id: "settings",
    lastOpenedFolder: null,
    recentFolders: [],
    api_keys: {},
  };

  constructor() {
    // Make `data` observable for MobX reactions
    makeAutoObservable(this.data);
  }

  // Get or open the IndexedDB database
  private async getDB(): Promise<IDBPDatabase<UserSettings>> {
    if (this.db) return this.db;

    this.db = await openDB<UserSettings>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });

    return this.db;
  }

  // Load stored settings into `data`
  async load(): Promise<UserSettings> {
    const db = await this.getDB();
    const stored = await db.get(STORE, "settings");

    if (stored) {
      runInAction(() => {
        // Merge stored values into observable `data`
        Object.assign(this.data, stored);
      });
    }

    return this.data;
  }

  // Save current `data` into IndexedDB
  async save(): Promise<void> {
    const db = await this.getDB();
    const plainData = toJS(this.data); // convert observables to plain objects
    await db.put(STORE, plainData);
  }

  // Update data using a mutator function and save
  async update(mutator: (data: UserSettings) => void): Promise<void> {
    runInAction(() => mutator(this.data));
    await this.save();
  }
}
