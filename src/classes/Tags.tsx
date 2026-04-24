import { makeObservable, observable, action, computed, toJS } from "mobx";
import type { LocalJson } from "./LocalJson";
import { Project } from "./Project";
import type { LocalImage } from "./fileSystem/LocalImage";
import type { LocalItem } from "./fileSystem/LocalItem";

export class Tags {
    dataJson: LocalJson | null = null;
    owner: LocalItem;
    dict_name = "refdata"

    constructor(owner: LocalItem, dataJson: LocalJson) {
        this.owner = owner;
        this.dataJson = dataJson;


        makeObservable(this, {
            dataJson: observable,           // observable reference to the LocalJson
            tags: computed,                 // computed getter/setter
            disabled_tags: computed,        // computed getter/setter
            tag_files: computed,            // computed derived property
            addTag: action,                 // actions to modify tags
            deleteTag: action,
            toggle: action                  // new action to toggle disabled state
        });
    }

    tagpath(tag: string | LocalItem) {
        return typeof tag === "string" ? tag : tag.path;
    }

    get tags(): any[] {
        return this.dataJson?.getField(`${this.dict_name}/tags`) ?? [];
    }

    get use_tags(): boolean {
        return this.dataJson?.getField(`${this.dict_name}/use_tags`) ?? true;
    }

    set use_tags(value: boolean) {
        this.dataJson?.updateField(`${this.dict_name}/use_tags`, value);
    }

    get parent_tags_obj(): Tags | null {
        let current: any = this.owner?.parentFolder;
        while (current) {
            if (current.references) {
                return current.references as Tags;
            }
            current = current.parentFolder;
        }
        return null;
    }

    get parent_tags(): any[] {
        const parentTags = this.parent_tags_obj?.get_active_tags ?? [];
        const ownTags = this.tags;
        return parentTags.filter(tag => !ownTags.includes(tag));
    }

    set tags(tags: any[]) {
        this.dataJson?.updateField(`${this.dict_name}/tags`, tags);
    }

    get disabled_tags(): any[] {
        return this.dataJson?.getField(`${this.dict_name}/disabled_tags`) ?? [];
    }
    set disabled_tags(tags: any[]) {
        this.dataJson?.updateField(`${this.dict_name}/disabled_tags`, tags);
    }

    get get_active_tags(): any[] {
        if (!this.use_tags) return [];
        const ownTags = this.tags;
        const parentTags = this.parent_tags_obj?.get_active_tags ?? [];
        const combinedTags = Array.from(new Set([...ownTags, ...parentTags]));
        return combinedTags.filter(tag => this.isActive(tag));
    }


    isActive(tag: string | LocalItem) {
        const path = this.tagpath(tag);
        return !this.disabled_tags.includes(path);
    }

    toggle(tag: string | LocalItem) {
        const path = this.tagpath(tag);
        if (this.isActive(tag)) {
            this.disabled_tags = [...this.disabled_tags, path];
        } else {
            this.disabled_tags = this.disabled_tags.filter(t => t !== path);
        }
    }

    get tag_files(): LocalItem[] {
        const project = Project.getProject();
        return this.tags
            .map((tag) => project.getByAbsPath(tag))
            .filter((item): item is LocalItem => item !== null && item !== undefined);
    }

    addTag(tag: string | LocalItem, toggle = false): void {
        const path = this.tagpath(tag);

        if (this.tags.includes(path)) {
            // Tag is already present
            if (toggle) {
                // Remove it if toggle is true
                this.tags = this.tags.filter((t) => t !== path);
            }
        } else {
            // Tag not present → always add
            this.tags = [...this.tags, path];
        }
    }

    deleteTag(tag: string | LocalItem): void {
        this.tags = this.tags.filter((t) => t !== this.tagpath(tag));
    }

    log() {
        console.log(toJS(this), toJS(this.tags));
    }

    get active_images(): LocalImage[] {
        const project = Project.getProject();

        return this.get_active_tags
            .map((tag) => project.getByAbsPath(tag))
            .filter((item): item is LocalImage => item !== null && item !== undefined);
    }

    async GetAI_Images() {
        const ref_images = this.active_images ?? [];

        const tagImages = await Promise.all(
            ref_images.map(async (image) => {
                const base64Obj = await image.getBase64();

                return {
                    rawBase64: base64Obj.rawBase64,
                    mime: base64Obj.mime,
                    description: image.path,
                };
            })
        );

        return tagImages;
    }
}