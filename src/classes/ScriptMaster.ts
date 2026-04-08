import { LocalFolder } from "./fileSystem/LocalFolder";
import { LocalJson } from "./LocalJson";





export class ScriptMaster extends LocalFolder {



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

    get episodes(): Record<string, any> {
        return this.getField("episodes") ?? {};
    }

    addEpisode(name?: string) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episodes/${finalName}`, {});
    }

    removeEpisode(name: string) {
        const { [name]: _, ...rest } = this.episodes;
        this.updateField("episodes", rest);
    }

    addScene(episode: string, name?: string) {
        const finalName = name || prompt("Please enter ScriptName:");

        if (!finalName || finalName.trim() === "") {
            console.log("No name provided, exiting function.");
            return;
        }

        this.updateField(`episodes/${episode}/scenes/${finalName}`, {});
    }

    removeScene(episode: string, sceneName: string) {
        // Get the current scenes object for this episode
        const scenes = this.getField(`episodes/${episode}/scenes`) ?? {};
        // Remove the scene
        const { [sceneName]: _, ...rest } = scenes;
        // Update the field
        this.updateField(`episodes/${episode}/scenes`, rest);
    }
}



