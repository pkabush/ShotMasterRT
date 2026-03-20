import { action, computed, makeObservable, observable, runInAction, toJS } from "mobx";
import type { LocalFolder } from "../fileSystem/LocalFolder";
import { LocalImage } from "../fileSystem/LocalImage";
import { LocalJson } from "../LocalJson";
import { MediaFolder } from "../MediaFolder";
import { Project } from "../Project";
import { GoogleAI } from "../GoogleAI";



export class Character extends MediaFolder {
    charJson: LocalJson | null = null;

    // MediaFolders
    MediaFolder_results: MediaFolder | null = null;
    generating_variations: string[] = [];

    workflows = {
        generate_variation: "generate_character_variation",

    }


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
            this.charJson = await LocalJson.create(this.handle, 'charinfo.json');
            this.MediaFolder_results = await MediaFolder.create(this, "results");
            this.MediaFolder_results.tags = ["ref_frame"];

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

    async setVariationImage(variationName: string) {
        const selectedImage = this.MediaFolder_results?.selectedMedia;
        if (!selectedImage) return;

        await selectedImage.copyToFolder(this, variationName);
        console.log(variationName);




    }

    async generateLook(variationName: string) {
        this.generating_variations.push(variationName)
        const project = Project.getProject()
        const workflow = project.workflows[this.workflows.generate_variation]

        const script_text = project.script?.text
        const workflow_prompt = workflow.prompt
        const var_prompt = this.variations[variationName].prompt

        const prompt = `Сценарий: 
        ${script_text}

        ${workflow_prompt}

        ${var_prompt}
        `

        // Send Request
        const result = await GoogleAI.img2img(
            prompt,
            workflow.model,
            [],
            workflow.aspect_ratio
        );

        // Save Result Image
        const localImage: LocalImage | null =
            await GoogleAI.saveResultImage(
                result,
                this.MediaFolder_results as LocalFolder
            );

        // Store Data

        if (localImage) {
            // Save Generation Info
            /*
            localImage?.mediaJson?.updateField("geninfo", {
                workflow: "shot_generate_image",
                prompt: prompt,
                model: this.scene.project.workflows.generate_shot_image.model,
                art_refs: this.getFilteredTags().map(tag => tag.path),
            })
            */
        }


    }




}