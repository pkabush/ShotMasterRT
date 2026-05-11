import { action, computed, makeObservable, observable, runInAction, } from "mobx";
import type { LocalFolder } from "../fileSystem/LocalFolder";
import { LocalImage } from "../fileSystem/LocalImage";
import { LocalJson } from "../LocalJson";
import { MediaFolder } from "../MediaFolder";
import { Project } from "../Project";
import { GoogleAI } from "../GoogleAI";
import { Tags } from "../Tags";
import type { Artbook } from "../Artbook";
import { AI } from "../AI_provider";



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
    use_defaultRefImage_field = "use_defaultRefImage_for_gen_image"

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

            // add char ref if character
            const artbook = this.parentFolder?.parentFolder as Artbook;
            if (this.parentFolder == artbook.characters_folder) {
                const char_ref_image = await artbook.getBaseCharRef() as LocalImage;
                this.references.addTag(char_ref_image);                
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
            //const workflow_prompt = workflow.prompt;
            const workflow_prompt = project.workflows[`${this.workflows.generate_variation_image}_${this.parentFolder?.name}`].prompt;
            const var_prompt = this.variations[variationName].prompt;

            const use_script = false && (this.charJson?.getField(this.use_script_field) ?? true);

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
            let reference_images = await this.references?.GetAI_Images();

            /*
            const artbook = this.parentFolder?.parentFolder as Artbook;
            
            if (reference_images?.length == 0 && this.parentFolder == artbook.characters_folder) {
                const char_ref_image = await artbook.getBaseCharRef() as LocalImage;
                reference_images = [await char_ref_image.getAIImage()]
                console.log("Added Default Char Ref Image");
            }*/

            const result = await GoogleAI.img2img(
                prompt,
                workflow.model ?? GoogleAI.options.img_models.flash_3_1,
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
            runInAction(() => {
                this.generating_variations = this.generating_variations.filter(v => v !== variationName);
            })
        }
    }

    async generateVariationDescriptions(add_variations = false,generate_variations = false) {
        const project = Project.getProject()
        const charlist_field = "looklist"
        const is_env = this.parentFolder?.name == "ЛОКАЦИИ"
        const wf_name = is_env ? this.workflows.generate_location_data : this.workflows.generate_variation_data

        const workflow = project!.workflows[wf_name] ?? ""
        const prompt = `
            SCRIPT:
            ${project!.script?.text}


            ${workflow.prompt} 
            ${this.name}
            `

        const res = await AI.GenerateText({
            prompt: prompt,
            model: workflow.model!,
        })

        if (res) {
            const clean = res.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
            await this.charJson!.updateField(charlist_field, clean)

            if (add_variations || (project.projinfo?.getField(`workflows/${wf_name}/auto_add`) ?? true)) this.addLooksFromLooklist(generate_variations);
        }
    }

    addLooksFromLooklist(generate = false) {
        const project = Project.getProject()
        const charlist_field = "looklist"
        const looks_json = this.charJson!.getField(charlist_field)
        const is_env = this.parentFolder?.name == "ЛОКАЦИИ"
        const wf_name = is_env ? this.workflows.generate_location_data : this.workflows.generate_variation_data

        let looks_data: Record<string, any>;
        try {
            looks_data = JSON.parse(looks_json);
        } catch (err) {
            console.error("Invalid shots JSON:", err);
            alert("Error: The shots JSON is invalid. Please check the format.");
            return;
        }

        for (const look_name of Object.keys(looks_data)) {
            const look_descrition = looks_data[look_name].replace(" ", "_");
            this.addVariation(look_name, look_descrition)
            if (generate || (project.projinfo?.getField(`workflows/${wf_name}/auto_gen`) ?? false)) { this.generateLook(look_name) }
        }
    }

    generateVariationsIfMissing() {
        console.log(this.name);
        if (Object.keys(this.variations).length == 0){
            console.log("No variations, generating ", this.name);
            this.generateVariationDescriptions(true,true);
        }
    }


}



