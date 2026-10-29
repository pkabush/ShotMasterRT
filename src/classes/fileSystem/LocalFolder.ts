import { computed, makeObservable } from "mobx";
import { LocalJson } from "../LocalJson";
import { LocalAudio } from "./LocalAudio";
import { LocalFile } from "./LocalFile";
import { LocalImage } from "./LocalImage";
import { LocalItem } from "./LocalItem";
import { LocalMedia } from "./LocalMedia";
import { LocalVideo } from "./LocalVideo";
import { WORKER_URL } from "../../contexts/GoogleUserContext";
import { unzipSync, zipSync } from "fflate";

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
        const folder = new FolderClass(parentFolder, handle) as T;
        await folder.load();
        return folder;
    }

    constructor(
        parentFolder: LocalFolder | null = null,
        handle: FileSystemDirectoryHandle
    ) {
        super(parentFolder, handle);
        this.handle = handle;

        makeObservable(this, {
            media: computed,
            mediaOrdered: computed,
        });
    }

    async load_subfolders<T extends LocalFolder = LocalFolder>(SubfolderType?: new (parent: LocalFolder, handle: FileSystemDirectoryHandle) => T) {
        const FolderClass = SubfolderType || LocalFolder;
        for await (const [_, entry] of this.handle.entries()) {
            if (entry.kind === "directory") {
                const loaded_folder = new FolderClass(this, entry as FileSystemDirectoryHandle);
                await loaded_folder.load();
            }
        }
    }

    get subfolders(): LocalFolder[] {
        return this.getType(LocalFolder);
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

    async saveFiles(files: File[]): Promise<LocalFile[]> {
        const savedFiles: LocalFile[] = [];

        for (const file of files) {
            try {
                const savedFile = await this.save_file(file);
                savedFiles.push(savedFile);
            } catch {
                // Ignore failed files
            }
        }

        return savedFiles;
    }

    get files(): LocalFile[] {
        return this.getType(LocalFile);
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

    /*
    async downloadFromUrl(url: string, filename?: string): Promise<LocalFile | null> {
        console.log("[LocalFolder] Download From URL");
        if (!this.handle) { throw new Error("Folder not loaded"); }

        try {
            const encodedTarget = encodeURIComponent(url);
            let response: Response | null = null;

            //Since we only use Seedance download form server form the start
            response = await fetch(
                `${WORKER_URL}/download-file?url=${encodedTarget}`,
                { credentials: "include", }
            );
            console.log("[LocalFolder] Download From URL RESPONSE recieved");

            if (!response.ok) {
                console.log("[LocalFolder] Response on OK");
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            console.log("[LocalFolder] Status:", response.status);
            console.log("[LocalFolder] Content-Type:", response.headers.get("content-type"));
            console.log("[LocalFolder] Content-Length:", response.headers.get("content-length"));
            console.log("[LocalFolder] Starting blob conversion...");


            console.log("[LocalFolder] Creating Blob");
            const blob = await response.blob();
            console.log("[LocalFolder] Creating URL");
            const urlObj = new URL(url);
            console.log("[LocalFolder] Created Blob And URL Object");


            // Determine extension
            const urlName = urlObj.pathname.split("/").pop() || "";
            const urlExt = urlName.includes(".") ? urlName.split(".").pop() : "";
            const mimeExt = blob.type?.split("/")[1];
            const ext = urlExt || mimeExt || "bin";
            console.log("[LocalFolder] Deterened Extansion");

            // Determine final filename
            let finalName: string;
            if (filename) {
                finalName = `${filename}.${ext}`;
            } else {
                const base = urlName || "download";
                finalName = base.includes(".") ? base : `${base}.${ext}`;
            }

            console.log("[LocalFolder] Constructed Filename");
            // Return CHILD if exists
            //for (const file of this.children) { if (file.name === finalName) return file as LocalFile; }

            // Save the file using the existing save_file logic
            const fileHandle = await this.handle.getFileHandle(finalName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log("[LocalFolder] Wrote File To Disk");

            const newMedia = await this.load_file(fileHandle);
            console.log("[LocalFolder] Loaded Downloaded file as Media");
            return newMedia;

        } catch (err) {
            console.error("Failed to download media from URL:", err);
            throw err;
        }
    }*/


    async downloadFromUrl(url: string, filename?: string): Promise<LocalFile | null> {
        console.log("[LocalFolder] Download From URL");
        if (!this.handle) { throw new Error("Folder not loaded"); }

        try {
            let response: Response | null = null;

            try {
                response = await fetch(url);
            } catch (err) {
                console.error("[LocalFolder]Proxy fetch failed:", err);
                return null;
            }

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
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


    async downloadFromUrl_serverStream(url: string, filename?: string): Promise<LocalFile | null> {
        console.log("[LocalFolder] Download From URL");

        if (!this.handle) {
            throw new Error("Folder not loaded");
        }

        let writable: FileSystemWritableFileStream | null = null;

        try {
            const encodedTarget = encodeURIComponent(url);

            // Download through the Cloudflare Worker
            const response = await fetch(
                `${WORKER_URL}/download-file?url=${encodedTarget}`,
                { credentials: "include" }
            );

            console.log("[LocalFolder] Download response received");

            if (!response.ok) {
                throw new Error(
                    `Download failed: ${response.status} ${response.statusText}`
                );
            }

            console.log("[LocalFolder] Status:", response.status);
            console.log("[LocalFolder] Content-Type:", response.headers.get("content-type"));
            console.log("[LocalFolder] Content-Length:", response.headers.get("content-length"));

            if (!response.body) {
                throw new Error("Download response has no readable body");
            }

            // Determine filename and extension
            const urlObj = new URL(url);
            const urlName = urlObj.pathname.split("/").pop() || "download";
            const urlExt = urlName.includes(".") ? urlName.split(".").pop() : "";
            const contentType = response.headers.get("content-type") || "";
            const mimeExt = contentType.split("/")[1]?.split(";")[0];

            console.log("[LocalFolder] Deterened Extansion");

            const ext = urlExt || mimeExt || "bin";
            console.log("EXT", ext)
            let finalName: string;

            if (filename) {
                finalName = `${filename}.${ext}`;
            } else {
                finalName = urlName.includes(".") ? urlName : `${urlName}.${ext}`;
            }

            console.log("[LocalFolder] Final filename:", finalName);

            // Create the destination file
            const fileHandle = await this.handle.getFileHandle(finalName, { create: true });
            writable = await fileHandle.createWritable();
            console.log("[LocalFolder] Starting streamed download");

            // Read the response stream and write each chunk directly to disk.
            const logIntervalMB = 0.1;
            const logIntervalBytes = logIntervalMB * 1024 * 1024;

            let bytesReceived = 0;
            let nextLogBytes = logIntervalBytes;

            let lastLogTime = performance.now();
            let lastLoggedBytes = 0;

            const reader = response.body.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    if (value) {
                        await writable.write(value);
                        bytesReceived += value.byteLength;

                        if (bytesReceived >= nextLogBytes) {
                            const now = performance.now();
                            const elapsedSeconds = (now - lastLogTime) / 1000;
                            const intervalBytes = bytesReceived - lastLoggedBytes;

                            // Speed in MiB/s (1024 * 1024 bytes per MiB)
                            const speedMBps =
                                elapsedSeconds > 0
                                    ? intervalBytes / (1024 * 1024) / elapsedSeconds
                                    : 0;

                            const receivedMB = bytesReceived / (1024 * 1024);

                            console.log(
                                `[LocalFolder] Downloaded ${receivedMB.toFixed(2)} MB | ` +
                                `Speed: ${speedMBps.toFixed(2)} MB/s`
                            );

                            lastLogTime = now;
                            lastLoggedBytes = bytesReceived;

                            // Advance to the next logging threshold.
                            nextLogBytes =
                                (Math.floor(bytesReceived / logIntervalBytes) + 1) *
                                logIntervalBytes;
                        }
                    }
                }
            } catch (streamError) {
                await reader.cancel().catch(() => { });
                throw streamError;
            }

            console.log("[LocalFolder] Stream finished. Total bytes:", bytesReceived);

            // Commit the file to disk.
            await writable.close();
            writable = null;
            console.log("[LocalFolder] Wrote File To Disk");
            // Load the downloaded file as media.
            const newMedia = await this.load_file(fileHandle);
            console.log("[LocalFolder] Loaded Downloaded file as Media");
            return newMedia;
        } catch (err) {
            // Abort the writable stream if an error occurs.
            if (writable) {
                try {
                    await writable.abort();
                } catch (abortError) {
                    console.warn(
                        "[LocalFolder] Failed to abort file write:",
                        abortError
                    );
                }
            }

            console.error(
                "[LocalFolder] Failed to download media from URL:",
                err
            );

            throw err;
        }
    }






    async copyFromClipboard() {
        if (!this.handle) { throw new Error("MediaFolder not loaded"); }
        if (!navigator.clipboard) {
            console.warn("Clipboard API not supported");
            return;
        }

        try {
            // --- 1. Try reading clipboard items ---
            if (navigator.clipboard.read) {
                const items = await navigator.clipboard.read();
                console.log("Clipboard items:", items);

                const pngFiles: File[] = [];
                for (const item of items) {
                    if (item.types.includes("image/png")) {
                        try {
                            const blob = await item.getType("image/png");
                            const file = new File([blob], `clipboard-${Date.now()}.png`, { type: "image/png" });
                            pngFiles.push(file);
                        } catch (err) {
                            console.warn("Failed to read image/png from clipboard:", err);
                        }
                    }
                }

                if (pngFiles.length > 0) {
                    await this.saveFiles(pngFiles);
                    console.info(`Saved ${pngFiles.length} PNG image(s) to ${this.path}`);
                    return;
                }
            }

            if (!navigator.clipboard.readText) {
                console.info("Text clipboard API not available");
                return;
            }

            const text = await navigator.clipboard.readText();
            if (!text) {
                console.info("Clipboard is empty");
                return;
            }

            // --- 4. Parse JSON only from plain text ---
            let data: any;
            try {
                data = JSON.parse(text);
            } catch {
                console.info("Clipboard text is not valid JSON");
                return;
            }

            // --- 5. Handle local_path ---
            if (data?.local_path) {
                console.info("Detected local file reference:", data.local_path);

                try {
                    const file = this.getByAbsPath?.(data.local_path) as LocalFile;
                    if (!file) {
                        console.warn("File not found for path:", data.local_path);
                        return;
                    }

                    await file.copyToFolder(this);
                    console.log("Copied", file, "to", this);
                } catch (err) {
                    console.error("Failed handling local_path clipboard:", err);
                }
                return;
            }

            console.info("Clipboard JSON not recognized:", data);
        } catch (err) {
            console.error("Failed to read from clipboard:", err);
        }
    }

    // Media Getters Folder 
    get media(): LocalMedia[] {
        return this.getType(LocalMedia)
    }

    get mediaOrdered(): LocalMedia[] {
        return [...this.media].sort(
            (a, b) => a.lastModified - b.lastModified
        );
    }

    // ZIP Utils
    async downloadAsZip(filename?: string): Promise<void> {
        const zipFiles: Record<string, Uint8Array> = {};

        // Recursively read a directory and collect its files.
        const addFolder = async (
            directory: FileSystemDirectoryHandle,
            relativePath: string
        ): Promise<void> => {
            for await (const [name, entry] of directory.entries()) {
                const entryPath = relativePath
                    ? `${relativePath}/${name}`
                    : name;

                if (entry.kind === "file") {
                    const fileHandle = entry as FileSystemFileHandle;
                    const file = await fileHandle.getFile();

                    zipFiles[entryPath] = new Uint8Array(
                        await file.arrayBuffer()
                    );
                } else {
                    const subdirectory =
                        entry as FileSystemDirectoryHandle;

                    // Preserve empty directories, too.
                    zipFiles[`${entryPath}/`] = new Uint8Array();

                    await addFolder(subdirectory, entryPath);
                }
            }
        };

        // Include the selected folder itself as the ZIP root.
        await addFolder(this.handle, this.handle.name);

        // Generate the ZIP archive.
        const zipData = zipSync(zipFiles, { level: 6 });

        const blob = new Blob([zipData], {
            type: "application/zip",
        });

        // Trigger the browser download.
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = filename ?? `${this.handle.name}.zip`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        // Release the temporary object URL.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    async extractZip(zipFile: File): Promise<void> {
        if (!this.handle) {
            throw new Error("Folder not loaded");
        }

        if (!zipFile.name.toLowerCase().endsWith(".zip")) {
            throw new Error("File must be a ZIP archive");
        }

        // Read and decompress the ZIP archive.
        const zipData = new Uint8Array(await zipFile.arrayBuffer());
        const extractedFiles = unzipSync(zipData);

        // Write each extracted file into the current folder.
        for (const [path, data] of Object.entries(extractedFiles)) {
            // Skip directory entries; directories are created as needed.
            if (path.endsWith("/")) {
                continue;
            }

            // Normalize and validate the path to prevent ZIP path traversal.
            const parts = path.replace(/\\/g, "/").split("/");

            if (
                parts.some(part => part === ".." || part === "") ||
                path.startsWith("/") ||
                /^[a-zA-Z]:/.test(path)
            ) {
                throw new Error(`Invalid path in ZIP archive: ${path}`);
            }

            // Create nested directories if necessary.
            let currentDir = this.handle;

            for (const dirName of parts.slice(0, -1)) {
                currentDir = await currentDir.getDirectoryHandle(
                    dirName,
                    { create: true }
                );
            }

            // Create or overwrite the extracted file.
            const filename = parts[parts.length - 1];
            const fileHandle = await currentDir.getFileHandle(
                filename,
                { create: true }
            );

            const writable = await fileHandle.createWritable();
            try {
                await writable.write(data);
            } finally {
                await writable.close();
            }
        }

        // Refresh the LocalFolder's in-memory representation.
        await this.load();
    }


}


export const file_type_map: [typeof LocalFile, string[]][] = [
    [LocalImage, ["png", "jpg", "jpeg", "gif", "webp"]],
    [LocalVideo, ["mp4", "mov", "webm", "avi"]],
    [LocalAudio, ["mp3", "wav", "m4a"]],
    [LocalJson, ["json"]]
];


