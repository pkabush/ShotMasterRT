import { action, computed, makeObservable, observable, } from "mobx";
import type { LocalFolder } from "../fileSystem/LocalFolder";
import { LocalImage } from "../fileSystem/LocalImage";
import { LocalJson } from "../LocalJson";
import { MediaFolder } from "../MediaFolder";
import { Project } from "../Project";
import { GoogleAI } from "../GoogleAI";
import { Tags } from "../Tags";



export class Character extends MediaFolder {
    charJson: LocalJson | null = null;

    // MediaFolders
    MediaFolder_results: MediaFolder | null = null;
    generating_variations: string[] = [];
    references: Tags | null = null;

    workflows = {
        generate_variation_data: "generate_character_variation_data",
        generate_location_data: "generate_character_location_data",
        generate_variation_image: "generate_character_variation_image",

    }

    use_script_field = "use_script_for_gen_image"

    constructor(parentFolder: LocalFolder | null, handle: FileSystemDirectoryHandle) {
        super(parentFolder, handle)

        makeObservable(this, {
            // observables
            generating_variations: observable,
            charJson: observable,
            generateLook: action,
            load: action,
            addVariation: action,
            variations: computed,
        });
    }

    get variations(): any {
        return this.charJson?.getField("variations") || {};
    }

    async load(): Promise<void> {
        try {
            this.charJson = await LocalJson.create(this, 'charinfo.json');
            this.MediaFolder_results = await MediaFolder.create(this, "results");
            this.MediaFolder_results.tags = ["ref_frame"];
            this.references = new Tags(this, this.charJson);

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


    addVariation(name?: string, descrition = "") {
        // Use prompt if name is not provided
        const finalName = name || prompt("Please enter something:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        console.log("Variation:", finalName);
        this.charJson?.updateField("variations/" + finalName, { prompt: descrition });
    }

    getVariationImage(variationName: string): LocalImage | null {
        const images = this.getType(LocalImage);
        const image = images.find(img => img.name_no_extension === variationName);
        return image || null;
    }

    async deleteVariation(variationName: string): Promise<void> {
        if (!variationName) return;

        try {
            // 1. Delete image if it exists
            const image = this.getVariationImage(variationName);
            if (image) { await image.delete(); }

            // 2. Remove from JSON (this also saves)
            await this.charJson?.updateField(
                `variations/${variationName}`,
                undefined
            );

        } catch (err) {
            console.error("Error deleting variation:", variationName, err);
        }
    }

    async setVariationImage(variationName: string, image?: LocalImage) {
        const selectedImage = image ?? this.MediaFolder_results?.selectedMedia;
        if (!selectedImage) return;

        await selectedImage.copyToFolder(this, variationName);
        console.log(variationName);
    }

    async generateLook(variationName: string) {
        this.generating_variations.push(variationName);

        try {
            const project = Project.getProject();
            const workflow = project.workflows[this.workflows.generate_variation_image];

            const script_text = project.script?.text;
            const workflow_prompt = workflow.prompt;
            const var_prompt = this.variations[variationName].prompt;

            const use_script = this.charJson?.getField(this.use_script_field) ?? true;

            const prompt = `${use_script ?
                    `Сценарий: 
${script_text}` : ``}

${workflow_prompt}
Character:
${this.name}
Description:
${var_prompt}
`;

            console.log(workflow_prompt, var_prompt);

            const reference_images = await this.references?.GetAI_Images();

            const result = await GoogleAI.img2img(
                prompt,
                workflow.model,
                reference_images,
                workflow.aspect_ratio
            );

            const localImage: LocalImage | null =
                await GoogleAI.saveResultImage(
                    result,
                    this.MediaFolder_results as LocalFolder
                );

            if (localImage) {
                localImage?.mediaJson?.updateField("geninfo", {
                    workflow: this.workflows.generate_variation_image,
                    prompt: var_prompt,
                    model: workflow.model,
                });

                this.setVariationImage(variationName, localImage);
            }

        } finally {
            // ✅ ALWAYS remove it
            this.generating_variations =
                this.generating_variations.filter(v => v !== variationName);
        }
    }

}




