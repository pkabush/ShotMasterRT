import {
    createContext,
    useContext,
    useMemo,
    type ReactNode,
} from "react";
import type { LocalJson } from "../../../classes/LocalJson";
import type { LocalFile } from "../../../classes/fileSystem/LocalFile";
import { TasksJson } from "../../../classes/Task";


interface LocalFileContextType {
    local_file: LocalFile;
    tasks_json: TasksJson;
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

    const value = useMemo(() => {
        const tasks_json =  new TasksJson(local_file as LocalJson);
        return {
            local_file,
            tasks_json
        }
    },[local_file])


    return (
        <LocalFileContext.Provider
            value={value}
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