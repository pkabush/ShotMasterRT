import { LocalFolder } from "./fileSystem/LocalFolder";
import { LocalJson } from "./LocalJson";





export class ScriptMaster extends LocalFolder {

    workflows = {
        gen_logline: "scriptmaster_generate_logline",
        gen_episodes: "scriptmaster_generate_episodes",
        gen_scenes:"scriptmaster_generate_scenes",
        gen_scene_script:"scriptmaster_generate_scene_script"
    }

    fields = {
        gen_logline: "prompts/generate_logline",
        gen_logline_output: "prompts/generate_logline_output",
        gen_episodes: "prompts/generate_episodes",
        gen_episodes_output: "prompts/generate_episodes_output",
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


    addEpisode(EpisodeListName: string, name?: string) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episode_lists/${EpisodeListName}/episodes/${finalName}`, {});
    }

    removeEpisode(episodeListName: string, name: string) {
        const { [name]: _, ...rest } = this.episodeLists[episodeListName].episodes;
        this.updateField(`episode_lists/${episodeListName}/episodes`, rest);
    }
    
    addScene(episodeListName: string,episode: string, name?: string) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episode_lists/${episodeListName}/episodes/${episode}/scenes/${finalName}`, {});
    }

    
    removeScene(episodeListName: string,episode: string, sceneName: string) {
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



}







