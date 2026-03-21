import { LocalAudio } from "./LocalAudio";
import { LocalFile, LocalItem } from "./LocalFile";
import { LocalImage } from "./LocalImage";
import { LocalVideo } from "./LocalVideo";

export class LocalFolder extends LocalItem {
    handle: FileSystemDirectoryHandle;

    static async open<T extends LocalFolder = LocalFolder>(
        parentFolder: LocalFolder | null,
        folderName: string,
        FolderType?: new (parent: LocalFolder | null, handle: FileSystemDirectoryHandle) => T
    ): Promise<T> {
        if (!folderName) {
            throw new Error("Folder name cannot be empty");
        }

        let handle: FileSystemDirectoryHandle;

        if (parentFolder) {
            handle = await parentFolder.handle.getDirectoryHandle(folderName, {
                create: true,
            });
        } else {
            throw new Error("Root folder access required. Provide a parent folder handle.");
        }

        const FolderClass = FolderType || LocalFolder;
        return new FolderClass(parentFolder, handle) as T;
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

    async load_file(fileHandle: FileSystemFileHandle): Promise<LocalFile> {
        const name = fileHandle.name;
        const ext = name.split(".").pop()?.toLowerCase() || "";

        // Resolve correct class
        let FileClass: typeof LocalFile = LocalFile;
        for (const [cls, extensions] of file_type_map) {
            if (extensions.includes(ext)) {
                FileClass = cls;
                break;
            }
        }

        // Instantiate the file
        const localFile = new FileClass(this, fileHandle);
        await localFile.load();
        return localFile;
    }


    async load_files() {
        for await (const [_, entry] of this.handle.entries()) {
            if (entry.kind === "file") {
                await this.load_file(entry as FileSystemFileHandle);
            }
        }
    }


    async save_file(file: File): Promise<LocalFile> {
        if (!this.handle) { throw new Error("Folder not loaded"); }

        try {
            // Create or overwrite
            const fileHandle = await this.handle.getFileHandle(file.name, { create: true, });

            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();

            // Reuse loader
            return await this.load_file(fileHandle);

        } catch (err) {
            console.error(`Failed to save file '${file.name}':`, err);
            throw err;
        }
    }

    async saveFiles(files: File[]) {
        for (const file of files) {
            try { await this.save_file(file); } catch { }
        }
    }

    get files(): LocalFile[] {
        return this.children.filter(
            (child): child is LocalFile => child instanceof LocalFile
        );
    }
    
    getType<T extends LocalItem>(
        type: new (...args: any[]) => T,
        options?: { deep?: boolean }
    ): T[] {
        const results: T[] = [];

        for (const child of this.children) {
            if (child instanceof type) {
                results.push(child);
            }

            // Recursive search in subfolders
            if (options?.deep && child instanceof LocalFolder) {
                results.push(...child.getType(type, options));
            }
        }

        return results;
    }

    async downloadFromUrl(url: string, filename?: string): Promise<LocalFile | null> {
        if (!this.handle) { throw new Error("Folder not loaded"); }

        try {
            const encodedTarget = encodeURIComponent(url);
            const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;


            let response: Response | null = null;

            try {
                // First attempt: direct fetch
                response = await fetch(url);
                //if (!response.ok) { throw new Error(`Direct fetch failed: ${response.statusText}`); }
            } catch (err) {
                console.warn("Direct fetch failed, trying local proxy:", err);
                try {
                    // Fallback to local proxy
                    response = await fetch(locUrl);
                    //if (!response.ok) { throw new Error(`Proxy fetch failed: ${response.statusText}`); }
                } catch (proxyErr: any) {
                    console.error("Proxy fetch failed:", proxyErr);
                    // Check if it's likely a connection refused error
                    if (proxyErr instanceof TypeError && proxyErr.message.includes("Failed to fetch")) {
                        alert("START THE SERVER!");
                    }
                    throw proxyErr;
                }
            }

            const blob = await response.blob();
            const urlObj = new URL(url);

            // Determine extension
            const urlName = urlObj.pathname.split("/").pop() || "";
            const urlExt = urlName.includes(".") ? urlName.split(".").pop() : "";
            const mimeExt = blob.type?.split("/")[1];
            const ext = urlExt || mimeExt || "bin";

            // Determine final filename
            let finalName: string;
            if (filename) {
                finalName = `${filename}.${ext}`;
            } else {
                const base = urlName || "download";
                finalName = base.includes(".") ? base : `${base}.${ext}`;
            }

            // Save the file using the existing save_file logic
            const fileHandle = await this.handle.getFileHandle(finalName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            const newMedia = await this.load_file(fileHandle);
            return newMedia;

        } catch (err) {
            console.error("Failed to download media from URL:", err);
            throw err;
        }
    }

    async copyFromClipboard() {
        if (!this.handle) { throw new Error("MediaFolder not loaded"); }
        if (!navigator.clipboard || !navigator.clipboard.read) {
            console.warn("Clipboard API not supported");
            return;
        }

        const files: File[] = [];

        try {
            const items = await navigator.clipboard.read();
            console.log("Clipboard items:", items);

            for (const item of items) {
                for (const type of item.types) {
                    const blob = await item.getType(type);
                    const filename = (blob as File).name || `clipboard-${Date.now()}.${type.split("/")[1]}`;
                    files.push(blob instanceof File ? blob : new File([blob], filename, { type }));
                }
            }

            if (files.length === 0) {
                console.info("Clipboard does not contain files");
                return;
            }

            await this.saveFiles(files);
            console.info(`Saved ${files.length} file(s) from clipboard to ${this.path}`);
        } catch (err) {
            console.error("Failed to read from clipboard:", err);
        }
    }
}

export const file_type_map: [typeof LocalFile, string[]][] = [
    [LocalImage, ["png", "jpg", "jpeg", "gif", "webp"]],
    [LocalVideo, ["mp4", "mov", "webm", "avi"]],
    [LocalAudio, ["mp3", "wav", "m4a"]],
];


