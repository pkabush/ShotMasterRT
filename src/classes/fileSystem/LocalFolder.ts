import { LocalJson } from "../LocalJson";
import { LocalAudio } from "./LocalAudio";
import { LocalFile, LocalItem } from "./LocalFile";
import { LocalImage } from "./LocalImage";
import { LocalVideo } from "./LocalVideo";

export class LocalFolder extends LocalItem {
    handle: FileSystemDirectoryHandle;

    static async open(
        parentFolder: LocalFolder | null,
        folderName: string
    ): Promise<LocalFolder> {
        if (!folderName) { throw new Error("Folder name cannot be empty"); }

        let handle: FileSystemDirectoryHandle;

        if (parentFolder) {
            // Get or create the folder inside parent
            handle = await parentFolder.handle.getDirectoryHandle(folderName, { create: true, });
        } else {
            // If no parent, assume root access is provided externally (browser permission required)
            throw new Error("Root folder access required. Provide a parent folder handle.");
        }

        return new LocalFolder(parentFolder, handle);
    }

    constructor(
        parentFolder: LocalFolder | null = null,
        handle: FileSystemDirectoryHandle
    ) {
        super(parentFolder);
        this.handle = handle;
        this.path = (parentFolder?.path || "") + "/" + (handle?.name || "");
    }

    get name(): string {
        return this.handle?.name;
    }

    async load_subfolders<T extends LocalFolder = LocalFolder>(SubfolderType?: new (parent: LocalFolder, handle: FileSystemDirectoryHandle) => T) {
        const FolderClass = SubfolderType || LocalFolder;
        for await (const [_, entry] of this.handle.entries()) {
            if (entry.kind === "directory") {
                new FolderClass(this, entry as FileSystemDirectoryHandle);
            }
        }
    }

    get subfolders(): LocalFolder[] {
        return this.children.filter(
            (child): child is LocalFolder => child instanceof LocalFolder
        );
    }


    async load_files() {
        for await (const [_, entry] of this.handle.entries()) {
            if (entry.kind === "file") {
                const fileHandle = entry as FileSystemFileHandle;
                const name = fileHandle.name;
                const ext = name.split(".").pop()?.toLowerCase() || "";

                // Find the first class that matches the extension
                let FileClass: typeof LocalFile = LocalFile;
                for (const [cls, extensions] of file_type_map) {
                    if (extensions.includes(ext)) {
                        FileClass = cls;
                        break;
                    }
                }

                new FileClass(this, fileHandle);
            }
        }
    }

    get files(): LocalFile[] {
        return this.children.filter(
            (child): child is LocalFile => child instanceof LocalFile
        );
    }

    getType<T extends LocalItem>(
        type: new (...args: any[]) => T
    ): T[] {
        return this.children.filter(
            (child): child is T => child instanceof type
        );
    }


}

export const file_type_map: [typeof LocalFile, string[]][] = [
    [LocalImage, ["png", "jpg", "jpeg", "gif", "webp"]],
    [LocalVideo, ["mp4", "mov", "webm", "avi"]],
    [LocalAudio, ["mp3", "wav", "m4a"]],
];


