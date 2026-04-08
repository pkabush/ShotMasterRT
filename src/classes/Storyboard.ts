// MediaFolder.ts
import { computed, makeObservable, observable } from "mobx";
import { LocalFolder } from "./fileSystem/LocalFolder";
import { MediaFolder } from "./MediaFolder";
import { LocalJson } from "./LocalJson";
import { Tags } from "./Tags";
import type { Scene } from "./Scene";
import { Project } from "./Project";
import { AI } from "./AI_provider";
import { GoogleAI } from "./GoogleAI";
import type { LocalImage } from "./fileSystem/LocalImage";

export class Storyboard extends MediaFolder {
    data: LocalJson | null = null;
    references: Tags | null = null;

    workflows = {
        gen_shot_prompts: "storyboard_generate_shot_prompts",
        gen_images: "storyboard_generate_shot_images",
    }

    fields = {
        shot_prompts: "storyboard_data/shot_prompts",
        gen_image_prompt: "storyboard_data/imageGen_prompt",
        shot_prompts_dict: "storyboard_data/shot_prompts_dict",
    }

    get storyboard(): string[] {
        return this.data?.getField("storyboard") ?? []
    }

    get shotPrompts(): Record<string, string> {
        return this.data?.getField(this.fields.shot_prompts_dict) ?? {}
    }

    createShotsFromDict() {
        const jsonStr = this.data?.getField(this.fields.shot_prompts);
        if (!jsonStr) {
            console.warn("No data found for shot_prompts");
            return;
        }
        try {
            const shots = JSON.parse(jsonStr);
            this.data?.updateField(this.fields.shot_prompts_dict, shots);
        } catch (err) {
            console.error("Invalid JSON in shot_prompts:", err);
        }
    }

    addImage(path: string, index?: number, replace = true) {
        let shots = [...this.storyboard];

        if (index === undefined) {
            shots = shots.filter(p => p !== path);
            shots.push(path);
        } else if (replace) {
            const oldPath = shots[index];
            shots = shots.map(p => (p === path ? oldPath : p));
            shots[index] = path;
        } else {
            console.log(index + 1);
            const insertIndex = index + 1;
            shots.splice(insertIndex, 0, path);
            shots = shots.filter((p, i) => p !== path || i === insertIndex);
        }

        this.data?.updateField("storyboard", shots);
    }

    removeImage(path: string) {
        if (!this.data) return;
        const shots = this.storyboard.filter(p => p !== path);
        this.data.updateField("storyboard", shots);
    }

    constructor(parentFolder: LocalFolder | null, handle: FileSystemDirectoryHandle) {
        super(parentFolder, handle)

        makeObservable(this, {
            data: observable,
            storyboard: computed,
        });
    }

    async load(): Promise<void> {
        try {
            this.data = await LocalJson.create(this, 'data.json');
            this.references = new Tags(this, this.data);
            await this.load_files()
        } catch (err) {
            console.error('Error loading shot:', this.name, err);
            this.data = null;
        }
    }

    get scene() {
        return this.parentFolder as Scene;
    }

    async generateImage(prompt_name: string) {
        console.log(prompt_name)

        const workflow = Project.getProject().workflows[this.workflows.gen_images]
        const prompt = `                
        ${workflow.prompt}

        ${this.data?.getField(this.fields.gen_image_prompt)}

        ${this.shotPrompts[prompt_name]}        
        `
        const images = await this.references?.GetAI_Images()

        console.log(workflow.aspect_ratio);

        // Add Images and resolution
        const res = await AI.GenerateImage({
            prompt,
            model: workflow.model ?? "",
            aspect_ratio: workflow.aspect_ratio,
            images
        })

        const new_image = await GoogleAI.saveResultImage(res, this);
        if (new_image) this.addImage(new_image.path);
    }

    async createShotsFromStoryboard(){
        for(const image_path of this.storyboard)
        {
            console.log(image_path);
            const image = this.getByAbsPath(image_path) as LocalImage
            if (image) {
                const shot = await this.scene.createShot();
                if(shot && shot.MediaFolder_results){
                    const new_image = await image.copyToFolder(shot.MediaFolder_results) as LocalImage;
                    new_image.setTags(["start_frame"]);
                }
            }
        }
    }
}
