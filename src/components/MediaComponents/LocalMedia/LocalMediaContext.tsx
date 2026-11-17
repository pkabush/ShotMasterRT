
import React, {
    createContext,
    useContext,
    useMemo
} from "react";

import type { LocalMedia } from "../../../classes/fileSystem/LocalMedia";

interface LocalMediaContextValue {
    mediaItem: LocalMedia;
}

const LocalMediaContext =
    createContext<LocalMediaContextValue | undefined>(undefined);

interface LocalMediaProviderProps {
    mediaItem: LocalMedia;
    children: React.ReactNode;
}

export const LocalMediaProvider: React.FC<LocalMediaProviderProps> = ({
    mediaItem,
    children
}) => {
    const value = useMemo(
        () => ({ mediaItem }),
        [mediaItem]
    );

    return (
        <LocalMediaContext.Provider value={value}>
            {children}
        </LocalMediaContext.Provider>
    );
};

export const useLocalMedia = (): LocalMediaContextValue => {
    const context = useContext(LocalMediaContext);

    if (!context) {
        throw new Error(
            "useLocalMedia must be used within LocalMediaProvider"
        );
    }

    return context;
};
