import { LocalImage } from "../fileSystem/LocalImage";
import { LocalJson } from "../LocalJson";
import { MediaFolder } from "../MediaFolder";



export class Character extends MediaFolder {
    charJson: LocalJson | null = null;

    // MediaFolders
    MediaFolder_results: MediaFolder | null = null;


    get variations(): any {
        return this.charJson?.getField("variations") || {};
    }

    async load(): Promise<void> {
        try {
            this.charJson = await LocalJson.create(this.handle, 'charinfo.json');
            this.MediaFolder_results = await MediaFolder.create(this, "results");

            await this.load_files()

            // Add images to variations dict
            for (const img of this.getType(LocalImage)) {
                const name = img.name_no_extension;
                if (!(name in this.variations)) { this.addVariation(name) }
            }
        } catch (err) {
            console.error('Error loading shot:', this.name, err);
            this.charJson = null;
        }
    }


    addVariation(name?: string) {
        // Use prompt if name is not provided
        const finalName = name || prompt("Please enter something:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        console.log("Variation:", finalName);
        this.charJson?.updateField("variations/" + finalName, { prompt: "" });
    }

    getVariationImage(variationName: string): LocalImage | null {
        const images = this.getType(LocalImage);
        const image = images.find(img => img.name_no_extension === variationName);
        return image || null;
    }



}