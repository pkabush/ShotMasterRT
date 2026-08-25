import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import SettingsButton from "../../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../WorkflowOptionSelect";
import { AI, AllImageModels, AllTextModels } from "../../../../classes/AI_provider";
import LoadingSpinner from "../../../Atomic/LoadingSpinner";
import { Button } from "react-bootstrap";
import EditableJsonTextField, { EditableJsonToggleField } from "../../../EditableJsonTextField";
import type { LocalImage } from "../../../../classes/fileSystem/LocalImage";
import { GoogleAI } from "../../../../classes/GoogleAI";
import type { LocalFolder } from "../../../../classes/fileSystem/LocalFolder";



interface Props {
    shot: Shot;
}

const wf_name = "shot_generate_staging_image"
const wf_loading = `${wf_name}/loading`
const wf_name_image = `${wf_name}/gen_image`
const wf_loading_image = `${wf_name_image}/loading`
const wf_image_prompt = `${wf_name}/image_prompt`
const wf_one_shot_mode = `${wf_name}/one_shot_mode`


const component: React.FC<Props> = observer(({ shot }) => {
    const project = shot.scene.project;
    const loading = shot.shotJson?.getField(wf_loading) ?? false;
    const loading_images = shot.shotJson?.getField(wf_loading_image) ?? false;


    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            console.log("Generate Staging Dscription");
                            ActionGenerateStagingPrompt(shot);
                        }} >
                        Generate Staging Prompt
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    <LoadingSpinner isLoading={loading} asButton />


                    <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => {
                            console.log("Generating Reference")
                            ActionGenerateStagingReference(shot);
                        }}
                    >
                        Generate Staging Image
                    </Button>

                    <WorkflowOptionSelect
                        workflowName={wf_name_image}
                        optionName={"model"}
                        values={AllImageModels}
                    />

                    <LoadingSpinner isLoading={loading_images} asButton />
                </>
            }
            content={
                <>
                    <EditableJsonToggleField localJson={project.projinfo} field={wf_one_shot_mode} default_val={false} label="One Shot Mode" />
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={shot.shotJson} field={wf_image_prompt} />
                </>
            }
        />
    </div >
})

export async function ActionGenerateStagingPrompt(shot: Shot) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const prompt = `
            ${workflow.prompt ?? ""}

            Description:
            ${shot.shotJson?.data.description}

            Paths to references I Already have:
            ${shot.references?.get_active_tags.join("\n")}
            `;

        const refs = await shot.scene.references?.GetAI_Images();

        const res = await AI.GenerateText({
            prompt,
            model: workflow.model ?? AllTextModels[0],
            images: refs,
        });

        await shot.shotJson!.updateField(wf_image_prompt, res);

    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }

    //await ActionGenerateReferences(shot);
}


export async function ActionGenerateStagingReference(shot: Shot) {
    const project = shot.scene.project;
    

    shot.shotJson?.updateField(wf_loading_image, true);
    const one_shot_mode = project.projinfo?.getField(wf_one_shot_mode);

    try {
        console.log("Generating Staging Image");
            const workflow = shot.scene.project.workflows[wf_name];

        const model =
            project.workflows[wf_name_image]?.model ??
            AllImageModels[0];

        const prompt = one_shot_mode ?
            `
            ${workflow.prompt ?? ""}

            Description:
            ${shot.shotJson?.data.description}

            Paths to references I Already have:
            ${shot.references?.get_active_tags.join("\n")}
            `
            :
            shot.shotJson?.getField(wf_image_prompt);

        const refs = await shot.scene.references?.GetAI_Images();

        const res = await AI.GenerateImage({
            prompt,
            model,
            images: refs,
        });

        if (res) {
            res.id = "Staging";
        }

        const localImage: LocalImage | null =
            await GoogleAI.saveResultImage(
                res,
                shot.MediaFolder_results as LocalFolder,
            );

        if (localImage) {
            shot.references?.addTag(localImage);
        }

        return localImage;

    } finally {
        shot.shotJson?.updateField(wf_loading_image, false);
    }
}

export const WF_ShotGenerateStagingImage = {
    wf_name,
    wf_loading,
    component,
}






