// -----------------------------
// Types
// -----------------------------

type MediaType = "video" | "image";

interface ClipMetadata {
    id: string;
    name: string;
    durationFrames: number;
    path: string;
    mediaType: MediaType;
}

export interface MediaItem {
    item: FileSystemFileHandle;
    type: MediaType;
    path: string;
}

export async function saveLocalTextFile(
    handle: FileSystemDirectoryHandle,
    filename: string,
    text: string
): Promise<void> {
    try {
        const fileHandle: FileSystemFileHandle =
            await handle.getFileHandle(filename, { create: true });

        const writable: FileSystemWritableFileStream =
            await fileHandle.createWritable();

        await writable.write(text);
        await writable.close();
    } catch (err) {
        console.error("Failed to save file", err);
    }
}

async function getVideoDuration(
    fileHandle: FileSystemFileHandle
): Promise<number> {
    const file: File = await fileHandle.getFile();
    const url: string = URL.createObjectURL(file);

    return new Promise<number>((resolve, reject) => {
        const video: HTMLVideoElement = document.createElement("video");
        video.preload = "metadata";
        video.src = url;

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load video metadata"));
        };
    });
}

export function prettyPrintXml(xmlString: string): string {
    const PADDING = "  ";
    const reg = /(>)(<)(\/*)/g;

    let xml = xmlString.replace(reg, "$1\r\n$2$3");
    let pad = 0;

    return xml
        .split("\r\n")
        .map((node: string) => {
            let indent = "";

            if (node.match(/<\/\w/)) pad -= 1;
            for (let i = 0; i < pad; i++) indent += PADDING;
            if (node.match(/<[^!?].*>[^<]*$/)) pad += 1;

            return indent + node;
        })
        .join("\r\n");
}

export async function filesToClips(
    files: MediaItem[],
    baseRoot: string,
    fps: number = 30,
    imageDurationSec: number = 5
): Promise<ClipMetadata[]> {
    const clips: ClipMetadata[] = [];

    for (const { item: handle, type: mediaType, path } of files) {
        const file: File = await handle.getFile();

        let durationFrames: number;

        if (mediaType === "video") {
            const durationSec = await getVideoDuration(handle);
            durationFrames = Math.round(durationSec * fps);
        } else {
            // Image: synthetic timeline duration
            durationFrames = imageDurationSec * fps;
        }

        clips.push({
            id: "r" + (clips.length + 2), // reserve r0/r1
            name: file.name,
            path,
            mediaType,
            durationFrames
        });
    }

    return clips;
}

export async function generateFCPXMLFromClips(
    clips: ClipMetadata[],
    timelineName = "Test (Resolve)"
): Promise<string> {
    const totalFrames: number = clips.reduce(
        (sum, c) => sum + c.durationFrames,
        0
    );

    // -----------------------------
    // DOM XML builder
    // -----------------------------
    const doc: XMLDocument = document.implementation.createDocument("", "", null);

    const fcpxml = doc.createElement("fcpxml");
    fcpxml.setAttribute("version", "1.10");
    doc.appendChild(fcpxml);

    // -----------------------------
    // Resources
    // -----------------------------
    const resources = doc.createElement("resources");
    fcpxml.appendChild(resources);

    // Video format for clips
    const format = doc.createElement("format");
    format.setAttribute("id", "r1");
    format.setAttribute("name", "FFVideoFormat1080p30");
    format.setAttribute("frameDuration", "1/30s");
    format.setAttribute("width", "1920");
    format.setAttribute("height", "1080");
    resources.appendChild(format);

    // Assets
    for (const clip of clips) {
        const asset = doc.createElement("asset");

        // Single-line style Resolve expects
        asset.setAttribute("format", "r1");
        asset.setAttribute(
            "src",
            `file://localhost/${clip.path.replace(/\\/g, "/")}`
        );
        asset.setAttribute("start", "0/1s");
        asset.setAttribute("name", clip.name);
        asset.setAttribute("duration", "0/1s"); // works for still images
        asset.setAttribute("hasVideo", "1");     // must be 1 for Resolve
        asset.setAttribute("id", clip.id);

        resources.appendChild(asset);
    }

    // -----------------------------
    // Library / Event / Project
    // -----------------------------
    const library = doc.createElement("library");
    fcpxml.appendChild(library);

    const event = doc.createElement("event");
    event.setAttribute("name", "Auto Import");
    library.appendChild(event);

    const project = doc.createElement("project");
    project.setAttribute("name", timelineName); // timeline name here
    event.appendChild(project);

    // -----------------------------
    // Sequence
    // -----------------------------
    const sequence = doc.createElement("sequence");
    sequence.setAttribute("format", "r1");
    sequence.setAttribute("duration", `${totalFrames}/30s`);
    sequence.setAttribute("tcStart", "0/1s");
    sequence.setAttribute("tcFormat", "NDF");
    project.appendChild(sequence);

    const spine = doc.createElement("spine");
    sequence.appendChild(spine);

    // -----------------------------
    // Asset clips
    // -----------------------------
    let offsetFrames = 0;

    for (const clip of clips) {
        let clipEl: HTMLElement;

        if (clip.mediaType === "image") {
            // Still images: use <video>
            clipEl = doc.createElement("video");
        } else {
            // Videos: use <clip>
            clipEl = doc.createElement("clip");
            clipEl.setAttribute("format", "r1");
        }

        clipEl.setAttribute("start", "0/1s");
        clipEl.setAttribute("ref", clip.id);
        clipEl.setAttribute("name", clip.name);
        clipEl.setAttribute("enabled", "1");
        clipEl.setAttribute("duration", `${clip.durationFrames}/30s`);
        clipEl.setAttribute("offset", `${offsetFrames}/30s`);

        // Transform (position / scale)
        const adjust = doc.createElement("adjust-transform");
        adjust.setAttribute("anchor", "0 0");
        adjust.setAttribute("scale", "1 1");
        adjust.setAttribute("position", "0 0");
        //clipEl.appendChild(adjust);

        spine.appendChild(clipEl);
        offsetFrames += clip.durationFrames;
    }

    // -----------------------------
    // Serialize
    // -----------------------------
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc);

    xmlString =
        `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n` +
        xmlString;

    console.log("Created Resolve-compatible FCPXML");
    console.log(prettyPrintXml(xmlString));

    return xmlString;
}
