// classes/UserSettingsDB.ts
import { openDB } from "idb";
import { makeAutoObservable, runInAction ,toJS} from "mobx";

export interface UserSettings {
  id: "settings";
  lastOpenedFolder: FileSystemDirectoryHandle | null;
  recentFolders: FileSystemDirectoryHandle[];
  api_keys: Record<string, string>;
}

const DB_NAME = "ShotMasterRE";
const STORE = "settings";

export class UserSettingsDB {
  private db: ReturnType<typeof openDB> | null = null;

  data: UserSettings = {
    id: "settings",
    lastOpenedFolder: null,
    recentFolders: [],
    api_keys: {},
  };

  constructor() {
    // Make `data` observable so changes to recentFolders, lastOpenedFolder, api_keys trigger MobX reactions
    makeAutoObservable(this.data);
  }

  private async getDB() {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });

    return this.db;
  }

  async load() {
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

  async save() {
    const db = await this.getDB();
    // Convert observables to plain objects for IDB
    const plainData = toJS(this.data);
    await db.put(STORE, plainData);
  }

  async update(mutator: (data: UserSettings) => void) {
    runInAction(() => {
      mutator(this.data);
    });
    await this.save();
  }
}
