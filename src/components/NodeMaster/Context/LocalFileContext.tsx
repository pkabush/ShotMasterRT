import {
    createContext,
    useContext,
    type ReactNode,
} from "react";
import type { LocalJson } from "../../../classes/LocalJson";
import type { LocalFile } from "../../../classes/fileSystem/LocalFile";


interface LocalFileContextType {
    local_file: LocalFile;
}

const LocalFileContext =
    createContext<LocalFileContextType | null>(null);

interface ProviderProps {
    local_file: LocalJson;
    children: ReactNode;
}

export const LocalFileProvider: React.FC<ProviderProps> = ({
    local_file,
    children,
}) => {

    
    return (
        <LocalFileContext.Provider
            value={{ local_file }}
        >
            {children}
        </LocalFileContext.Provider>
    );
};

export const useLocalFile = () => {
    const ctx = useContext(LocalFileContext);

    if (!ctx) {
        throw new Error(
            "useLocalFile must be used inside LocalFileProvider"
        );
    }

    return ctx;
};