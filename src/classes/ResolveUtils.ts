// -----------------------------
// Types
// -----------------------------

type MediaType = "video" | "image";

const frame_rate = 24;

export interface MediaItem {
    item: FileSystemFileHandle;
    type: MediaType;
    path: string;
}


export class FCPXMLBuilder {
    private doc: XMLDocument;
    private fcpxml: Element;
    private resources: Element;
    private project: Element;
    private spine: Element;
    private timelineName: string;


    constructor(timelineName = "Test RESOLVE", totalFrames = 10000) {
        this.timelineName = timelineName;
        // Initialize XML document
        this.doc = document.implementation.createDocument("", "", null);

        // Root element
        this.fcpxml = this.doc.createElement("fcpxml");
        this.fcpxml.setAttribute("version", "1.10");
        this.doc.appendChild(this.fcpxml);

        // Resources
        this.resources = this.doc.createElement("resources");
        this.fcpxml.appendChild(this.resources);

        // Add default video format
        const format = this.doc.createElement("format");
        format.setAttribute("id", "r0");
        format.setAttribute("name", `FFVideoFormat1080p${frame_rate}`);
        format.setAttribute("frameDuration", `1/${frame_rate}s`);
        format.setAttribute("width", "1080");
        format.setAttribute("height", "1920");
        this.resources.appendChild(format);

        // -----------------------------
        // Create Library / Event / Project / Sequence / Spine
        // -----------------------------
        const library = this.doc.createElement("library");
        this.fcpxml.appendChild(library);

        const event = this.doc.createElement("event");
        event.setAttribute("name", "Auto Import");
        library.appendChild(event);

        this.project = this.doc.createElement("project");
        this.project.setAttribute("name", this.timelineName);
        event.appendChild(this.project);

        const sequence = this.doc.createElement("sequence");
        sequence.setAttribute("format", "r0");
        sequence.setAttribute("duration", `${totalFrames}/${frame_rate}s`);
        sequence.setAttribute("tcStart", "0/1s");
        sequence.setAttribute("tcFormat", "NDF");
        this.project.appendChild(sequence);

        this.spine = this.doc.createElement("spine");
        sequence.appendChild(this.spine);

        // -----------------------------
        // Create effects first with IDs r1 and r2
        // -----------------------------
        const vivid = this.doc.createElement("effect");
        vivid.setAttribute(
            "uid",
            ".../Generators.localized/Solids.localized/Vivid.localized/Vivid.motn"
        );
        vivid.setAttribute("name", "Vivid");
        vivid.setAttribute("id", "r1");
        this.resources.appendChild(vivid);

        const basicTitle = this.doc.createElement("effect");
        basicTitle.setAttribute(
            "uid",
            //".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"
            ".../Titles.localized/Lower Thirds.localized/Basic Lower Third.localized/Basic Lower Third.moti"
        );
        basicTitle.setAttribute("name", "Basic Title");
        basicTitle.setAttribute("id", "r2");
        this.resources.appendChild(basicTitle);

    }

    // -----------------------------
    // Add a single asset
    // -----------------------------
    addAsset(path: string, name: string, hasVideo: boolean = false, duration: number = 5) {
        const asset = this.doc.createElement("asset");
        asset.setAttribute("format", "r0");
        asset.setAttribute("src", `file://localhost/${path.replace(/\\/g, "/")}`);
        asset.setAttribute("start", "0/1s");
        asset.setAttribute("name", name);
        //asset.setAttribute("duration", `${durationFrames}/${frame_rate}s`);
        if (hasVideo) {
            asset.setAttribute("duration", `${duration}/${1}s`);
            asset.setAttribute("hasVideo", "1");
        }

        // Generate a unique ID based on the number of existing assets
        const currentAssets = this.resources.children;
        const newIdNumber = currentAssets.length;
        asset.setAttribute("id", `r${newIdNumber}`);

        this.resources.appendChild(asset);

        return asset.getAttribute("id");
    }

    // -----------------------------
    // Append clip to spine
    // -----------------------------
    appendClip(id: string, name: string, durationFrames: number, offsetFrames: number, lane: number = 0) {
        const clipEl = this.doc.createElement("video")
        clipEl.setAttribute("start", "0/24s");
        clipEl.setAttribute("ref", id);
        clipEl.setAttribute("name", name);
        clipEl.setAttribute("enabled", "1");
        clipEl.setAttribute("lane", lane.toString());
        //clipEl.setAttribute("duration", `${durationFrames}/${frame_rate}s`);
        //clipEl.setAttribute("offset", `${offsetFrames}/${frame_rate}s`);
        clipEl.setAttribute("duration", `${durationFrames}/1s`);
        clipEl.setAttribute("offset", `${offsetFrames}/1s`);
        this.spine.appendChild(clipEl);
    }

    appendText(
        text: string,
        durationFrames: number,
        offsetFrames: number,
        lane: number = 3, // optional lane number
        name: string = "Rich" // optional title name
    ) {
        // Create <title> element
        const titleEl = this.doc.createElement("title");
        titleEl.setAttribute("start", "1/24s");

        // Assign next available resource ID
        titleEl.setAttribute("ref", "r2");
        titleEl.setAttribute("name", name);
        titleEl.setAttribute("lane", lane.toString());
        //titleEl.setAttribute("offset",  `${offsetFrames}/${frame_rate}s`);
        //titleEl.setAttribute("duration", `${durationFrames}/${frame_rate}s`);
        titleEl.setAttribute("offset", `${offsetFrames}/1s`);
        titleEl.setAttribute("duration", `${durationFrames}/1s`);

        titleEl.setAttribute("enabled", "1");

        // <text> element
        const textEl = this.doc.createElement("text");
        textEl.setAttribute("roll-up-height", "0");

        const textStyleRef = this.doc.createElement("text-style");
        textStyleRef.setAttribute("ref", "ts0");
        textStyleRef.textContent = text;
        textEl.appendChild(textStyleRef);
        titleEl.appendChild(textEl);

        // <text-style-def> element
        const styleDef = this.doc.createElement("text-style-def");
        styleDef.setAttribute("id", "ts0");

        const style = this.doc.createElement("text-style");
        style.setAttribute("fontSize", "32");
        style.setAttribute("italic", "0");
        style.setAttribute("fontColor", "1 1 1 1");
        style.setAttribute("bold", "1");
        style.setAttribute("lineSpacing", "0");
        style.setAttribute("font", "Open Sans");
        style.setAttribute("alignment", "center");
        style.setAttribute("strokeWidth", "0");
        style.setAttribute("strokeColor", "0 0 0 1");

        styleDef.appendChild(style);
        titleEl.appendChild(styleDef);

        // <adjust-transform> element
        const adjust = this.doc.createElement("adjust-transform");
        adjust.setAttribute("scale", "1 1");
        adjust.setAttribute("anchor", "0 0");
        adjust.setAttribute("position", "0 1");
        titleEl.appendChild(adjust);

        // Append to spine
        this.spine.appendChild(titleEl);
    }

    getXmlString() {
        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(this.doc);
        xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n` + xmlString;
        return xmlString;
    }

    log() {
        const PADDING = "  ";
        const reg = /(>)(<)(\/*)/g;

        let xml = this.getXmlString().replace(reg, "$1\r\n$2$3");
        let pad = 0;

        const xml_str = xml
            .split("\r\n")
            .map((node: string) => {
                let indent = "";

                if (node.match(/<\/\w/)) pad -= 1;
                for (let i = 0; i < pad; i++) indent += PADDING;
                if (node.match(/<[^!?].*>[^<]*$/)) pad += 1;

                return indent + node;
            })
            .join("\r\n");
        console.log(xml_str);
    }

    async save(handle: FileSystemDirectoryHandle) {
        try {
            const fileHandle: FileSystemFileHandle =
                await handle.getFileHandle(this.timelineName + ".xml", { create: true });

            const writable: FileSystemWritableFileStream =
                await fileHandle.createWritable();

            await writable.write(this.getXmlString());
            await writable.close();
        } catch (err) {
            console.error("Failed to save file", err);
        }


    }
}
