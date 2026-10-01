import { create } from "zustand";

interface DebugStore {
    debug_log: boolean;
    setDebugLog: (enabled: boolean) => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
    debug_log: false,

    setDebugLog: (enabled: boolean) => {
        set({ debug_log: enabled });
    },
}));