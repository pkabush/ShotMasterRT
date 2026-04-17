import { action, makeObservable, observable } from "mobx";
import { LocalFolder } from "./fileSystem/LocalFolder";
import { LocalJson } from "./LocalJson";
import { Project } from "./Project";
import { AI, AllTextModels } from "./AI_provider";


export class ScriptMaster extends LocalFolder {

    workflows = {
        gen_logline: "scriptmaster_generate_logline",
        gen_episodes: "scriptmaster_generate_episodes",
        gen_episodes_text: "scriptmaster_generate_episodes_text",
        gen_scenes: "scriptmaster_generate_scenes",
        gen_scene_script: "scriptmaster_generate_scene_script"
    }

    fields = {
        gen_logline: "prompts/generate_logline",
        gen_logline_output: "prompts/generate_logline_output",
        gen_episodes: "prompts/generate_episodes",
        gen_episodes_text: "prompts/generate_episodes_text",
        gen_episodes_output: "prompts/generate_episodes_output",
        gen_episodes_text_output: "prompts/generate_episodes_text_output",
        episode_list: "episode_lists",
    }

    async load(): Promise<void> {
        await this.load_files();

        for (const file of this.children) {
            if (file instanceof LocalJson) {
                const reload = new ModularScript(this, file.handle);
                await reload.load();

            }
        }
    }



    async createScript(name?: string) {
        // Use prompt if name is not provided
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        const handle = await this.handle.getFileHandle(finalName + ".json", { create: true });
        const localJson = new ModularScript(this, handle);
        await localJson.load();

    }



}



export class ModularScript extends LocalJson {

    generating = new GenerationProgressStore();

    addEpisode(EpisodeListName: string, name?: string, data?: {}) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episode_lists/${EpisodeListName}/episodes/${finalName}`, data);
    }

    removeEpisode(episodeListName: string, name: string) {
        const { [name]: _, ...rest } = this.episodeLists[episodeListName].episodes;
        this.updateField(`episode_lists/${episodeListName}/episodes`, rest);
    }

    addScene(episodeListName: string, episode: string, name?: string, data = {}) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episode_lists/${episodeListName}/episodes/${episode}/scenes/${finalName}`, data);
    }


    removeScene(episodeListName: string, episode: string, sceneName: string) {
        // Get the current scenes object for this episode
        const scenes = this.getField(`episode_lists/${episodeListName}/episodes/${episode}/scenes`) ?? {};
        // Remove the scene
        const { [sceneName]: _, ...rest } = scenes;
        // Update the field
        this.updateField(`episode_lists/${episodeListName}/episodes/${episode}/scenes`, rest);
    }

    // Episode Lists Remake

    get episodeLists(): Record<string, any> {
        return this.getField("episode_lists") ?? {};
    }

    set episodeLists(newList: Record<string, any>) {
        this.updateField("episode_lists", newList);
    }

    createEpisodesFromEpisodeList(episodeListName: string) {
        const src = this.getField(`episode_lists/${episodeListName}/text`);

        const parsed = Object.entries(
            splitTextByPrefix(src, "**Episode_")[1] ?? {}
        ) as [string, string][];

        // desired state from text
        const desiredEpisodes = new Map(parsed);

        // current state in system
        const currentEpisodes =
            this.getField(`episode_lists/${episodeListName}/episodes`) ?? {};

        // 1. REMOVE episodes that are not in the list
        for (const existingName of Object.keys(currentEpisodes)) {
            if (!desiredEpisodes.has(existingName)) {
                this.removeEpisode(episodeListName, existingName);
            }
        }

        // 2. CREATE or UPDATE episodes
        for (const [episodeName, episodeDescription] of desiredEpisodes) {
            const existing = currentEpisodes[episodeName];

            if (existing) {
                // update only description (keep scenes intact)
                this.updateField(
                    `episode_lists/${episodeListName}/episodes/${episodeName}/description`,
                    episodeDescription
                );
            } else {
                // create new episode
                this.addEpisode(episodeListName, episodeName, {
                    description: episodeDescription,
                    scenes: {}
                });
            }
        }
    }



    createEpisodeListFromEpisodes(episodeListName: string) {
        const episodes = this.getEpisodes(episodeListName);

        let out: string[] = [this.getField("logline")];
        out.push("");
        out.push("");
        out.push("");

        for (const [_, episode] of Object.entries(episodes)) {
            out.push((episode as any).description ?? "");
            out.push("");
        }

        const text = out.join("\n");
        this.updateField(`episode_lists/${episodeListName}/text`, text);
    }


    removeEpisodeList(name: string) {
        const { [name]: _, ...rest } = this.episodeLists;
        this.episodeLists = rest;
    }

    addEpisodeList(name?: string) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episode_lists/${finalName}`, {});
    }

    getEpisodes(episodeListName: string) {
        const episodes =
            this.getField(`episode_lists/${episodeListName}/episodes`) ?? {};

        return Object.fromEntries(
            Object.entries(episodes).sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
            )
        );
    }

    getScenes(episodeListName: string, episodeName: string) {
        const scenes =
            this.getField(`episode_lists/${episodeListName}/episodes/${episodeName}/scenes`) ?? {};

        return Object.fromEntries(
            Object.entries(scenes).sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
            )
        );
    }

    // GENERATE
    async generateSceneScript(episodeList: string, episode: string, sceneName: string) {
        const script = this;

        const project = Project.getProject()
        const wf_name = project.scriptmaster.workflows.gen_scene_script;

        const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/script`
        const gen_prompt_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_prompt`
        const use_logline_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_use_logline`
        const use_episode_desc_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_use_desc`
        const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]
        const gen_id = `${script.path}#${gen_res_field}`

        script.generating.add(gen_id)

        try {
            const workflow = project.workflows[wf_name] ?? ""
            const prompt = `
            ${workflow.prompt}  


            ${script.getField(use_logline_field) ?? true ?
                    `logline:
            ${script.getField("logline")}` : ""
                }

            ${script.getField(use_episode_desc_field) ?? true ?
                    `Episode description:
            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`)}` : ""
                }

            Scene description:
            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/description`)}


            ${script.getField(gen_prompt_field) ?? ""}          
            `

            const res = await AI.GenerateText({
                prompt: prompt,
                model: model,
            })

            if (!res) return;
            script.updateField(gen_res_field, res)
        }
        catch (err) {
            console.error("Generation failed:", err);
        } finally {
            script.generating.remove(gen_id);
        }
    }


    // GENERATE
    async generateEpisodeScript(episodeList: string, episode: string) {
        const script = this;

        const project = Project.getProject()
        const wf_name = project.scriptmaster.workflows.gen_scene_script;

        const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/script`
        const gen_prompt_field = `episode_lists/${episodeList}/episodes/${episode}/gen_script_prompt`
        const use_logline_field = `episode_lists/${episodeList}/episodes/${episode}/gen_script_use_logline`
        const use_episode_desc_field = `episode_lists/${episodeList}/episodes/${episode}/gen_script_use_desc`
        const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]
        const gen_id = `${script.path}#${gen_res_field}`

        const scenes_field = `episode_lists/${episodeList}/episodes/${episode}/gen_scenes_output`

        script.generating.add(gen_id)

        try {
            const workflow = project.workflows[wf_name] ?? ""
            const prompt = `
            ${workflow.prompt}  


            ${script.getField(use_logline_field) ?? true ?
                    `logline:
            ${script.getField("logline")}` : ""
                }

            ${script.getField(use_episode_desc_field) ?? true ?
                    `Episode description:
            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`)}` : ""
                }

            Scenes:
            ${script.getField(scenes_field)}


            ${script.getField(gen_prompt_field) ?? ""}          
            `

            const res = await AI.GenerateText({
                prompt: prompt,
                model: model,
            })

            if (!res) return;
            script.updateField(gen_res_field, res)
        }
        catch (err) {
            console.error("Generation failed:", err);
        } finally {
            script.generating.remove(gen_id);
        }
    }


    async generateAllSceneDescriptions(episodeList: string) {
        for (const episode of Object.keys(this.getEpisodes(episodeList))) {
            this.generateSceneDescriptions(episodeList, episode, true);
        }
    }

    async generateSceneDescriptions(episodeList: string, episode: string, createScenes = false) {
        const script = this;

        const project = Project.getProject()
        const wf_name = project.scriptmaster.workflows.gen_scenes;
        const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/gen_scenes_output`
        const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]
        const gen_id = `${script.path}#${gen_res_field}`

        script.generating.add(gen_id)
        try {

            const workflow = project.workflows[wf_name] ?? ""
            const prompt = `
            ${script.getField(`episode_lists/${episodeList}/text`)}
            
            ${workflow.prompt}  

            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`)}

            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/gen_scenes_prompt`)}          
            `

            const res = await AI.GenerateText({
                prompt: prompt,
                model: model,
            })

            if (!res) return;
            script.updateField(gen_res_field, res)

            if (createScenes) script.createScenesFromScenesText(episodeList, episode);
        }
        catch (err) {
            console.error("Generation failed:", err);
        } finally {
            script.generating.remove(gen_id);
        }
    }

    createScenesFromJsonRes(episodeList: string, episode: string) {
        const script = this;
        const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/gen_scenes_output`

        const src = script.getField(gen_res_field)
        const clean = src.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const scenes_field = `episode_lists/${episodeList}/episodes/${episode}/scenes`
        script.updateField(scenes_field, { ...script.getField(scenes_field), ...JSON.parse(clean) });
    }

    createScenesFromScenesText(episodeList: string, episode: string) {
        const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/gen_scenes_output`;

        const src = this.getField(gen_res_field);

        const parsed = Object.entries(
            splitTextByPrefix(src, "**Scene_")[1] ?? {}
        ) as [string, string][];

        // desired state
        const desiredScenes = new Map(parsed);

        // current state
        const currentScenes =
            this.getField(`episode_lists/${episodeList}/episodes/${episode}/scenes`) ?? {};

        // 1. REMOVE scenes not present anymore
        for (const existingName of Object.keys(currentScenes)) {
            if (!desiredScenes.has(existingName)) {
                this.removeScene(episodeList, episode, existingName);
            }
        }

        // 2. CREATE or UPDATE
        for (const [sceneName, sceneDescription] of desiredScenes) {
            const existing = currentScenes[sceneName];

            if (existing) {
                // update only description, preserve script
                this.updateField(
                    `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/description`,
                    sceneDescription
                );
            } else {
                // create new scene
                this.addScene(episodeList, episode, sceneName, {
                    description: sceneDescription,
                    script: ""
                });
            }
        }
    }

    createScenesTextFromScenes(episodeList: string, episode: string) {
        const script = this;

        const scenes = script.getScenes(episodeList, episode);

        let out: string[] = [];

        for (const [_, scene] of Object.entries(scenes)) {
            out.push((scene as any).description ?? "");
            out.push(""); // separator between scenes
        }

        const text = out.join("\n");
        const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/gen_scenes_output`;

        script.updateField(gen_res_field, text);
    }


    async generateAllSceneScripts(episodeList: string) {
        const episodes = this.getEpisodes(episodeList);

        for (const episodeName of Object.keys(episodes)) {
            const scenes = this.getScenes(episodeList, episodeName);

            for (const sceneName of Object.keys(scenes)) {
                this.generateSceneScript(
                    episodeList,
                    episodeName,
                    sceneName
                );
            }
        }
    }

    async generateAllEpisodeScripts(episodeList: string) {
        const episodes = this.getEpisodes(episodeList);

        for (const episodeName of Object.keys(episodes)) {
            this.generateEpisodeScript(
                episodeList,
                episodeName
            );
        }
    }

}








export class GenerationProgressStore {
    generatingItems: string[] = [];

    constructor() {
        makeObservable(this, {
            generatingItems: observable,
            add: action,
            remove: action,
            clear: action,
        });
    }

    add(id: string) {
        if (!this.generatingItems.includes(id)) {
            this.generatingItems.push(id);
        }
    }

    remove(id: string) {
        this.generatingItems = this.generatingItems.filter(i => i !== id);
    }

    clear() {
        this.generatingItems = [];
    }

    isGenerating(id: string) {
        return this.generatingItems.includes(id);
    }
}



export function splitTextByPrefix(
    text: string | undefined,
    prefix: string
): [string, Record<string, string>] {

    // ✅ guard
    if (typeof text !== "string") {
        return ["", {}];
    }

    const escapeRegex = (str: string) =>
        str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`^${escapeRegex(prefix)}.+`, "gm");

    const matches = [...text.matchAll(regex)];

    // No matches → everything is preface
    if (matches.length === 0) {
        return [text, {}];
    }

    const sections: Record<string, string> = {};
    let preface = "";

    for (let i = 0; i < matches.length; i++) {
        const header = matches[i][0];
        const start = matches[i].index!;

        // First match → capture preface
        if (i === 0 && start > 0) {
            preface = text.slice(0, start);
        }

        const end =
            i + 1 < matches.length ? matches[i + 1].index! : text.length;

        sections[header] = text.slice(start, end);
    }

    return [preface, sections];
}
