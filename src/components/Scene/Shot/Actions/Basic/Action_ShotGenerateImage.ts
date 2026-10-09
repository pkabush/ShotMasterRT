import { runInAction } from "mobx";
import type { Shot } from "../../../../../classes/Shot";
import { GoogleAI } from "../../../../../classes/GoogleAI";
import type { LocalImage } from "../../../../../classes/fileSystem/LocalImage";
import type { LocalFolder } from "../../../../../classes/fileSystem/LocalFolder";
import { AI } from "../../../../../classes/AiProviders/AI_Generic";

export async function action_shotGenerateImage(shot: Shot): Promise<void> {
    runInAction(() => {
        shot.is_generating = true;
    });

    try {
        const images = shot.references?.active_images ?? [];
        const prompt = shot.shotJson?.data.prompt as string || "";
        const workflow = shot.scene.project.workflows.generate_shot_image;

        const result = await AI.sendMessages(
            [
                prompt,
                ...images
            ],
            workflow.model ?? "",
            workflow.aspect_ratio || GoogleAI.options.aspect_ratios.r9x16,
            workflow.resolution || GoogleAI.options.resolution.none,
        );


        const localImage: LocalImage | null =
            await GoogleAI.saveResultImage(
                result,
                shot.MediaFolder_results as LocalFolder,
            );

        if (localImage) {
            localImage.mediaJson?.updateField("geninfo", {
                workflow: "shot_generate_image",
                prompt,
                model: workflow.model,
                art_refs: shot.references?.get_active_tags ?? [],
            });
        }
    } catch (err) {
        console.error("GenerateImage failed:", err);
    } finally {
        runInAction(() => {
            shot.is_generating = false;
        });
    }
}