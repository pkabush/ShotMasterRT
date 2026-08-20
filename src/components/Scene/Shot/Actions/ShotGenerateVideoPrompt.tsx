import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import SettingsButton from "../../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../../../classes/AI_provider";
import LoadingSpinner from "../../../Atomic/LoadingSpinner";
import EditableJsonTextField from "../../../EditableJsonTextField";
import { WF_ShotGenerateShotlist } from "./ShotGenerateShotList";

const wf_name = "shot_generate_video_prompt"
const wf_output = `${wf_name}/output`
const wf_loading = `${wf_name}/loading`

interface Props {
    shot: Shot;
}


export const ShotGenerateVideoPrompt: React.FC<Props> = observer(({ shot }) => {
    //const project = shot.scene.project;

    const loading = shot.shotJson?.getField(wf_loading) ?? false;

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => { ActionGenerateVideoPrompt(shot); }} >
                        Generate Video Prompt
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect workflowName={wf_name} optionName={"model"} values={AllTextModels} />

                    <LoadingSpinner isLoading={loading} asButton />




                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={shot.shotJson} field={wf_output} />

                </>
            }
        />
    </div>;
});


export async function ActionGenerateVideoPrompt(shot: Shot) {
    const project = shot.scene.project;

    shot.shotJson?.updateField(wf_loading, true);

    try {

        const workflow = shot.scene.project.workflows[wf_name];

        const prompt = `
        ${workflow.prompt ?? ""}

        Generation Description:
        ${shot.shotJson?.data.description}

        Shotlist:
        ${shot.shotJson?.getField(WF_ShotGenerateShotlist.wf_output)}

        References Ordered:
`;

        const images = await shot.references?.GetAI_Images();

        const model =
            project.workflows[wf_name].model ??
            AllTextModels[0];

        const res = await AI.GenerateText({
            prompt,
            model,
            images
        });

        await shot.shotJson!.updateField(wf_output, res);
        await shot.shotJson!.updateField("video_prompt", res);
        

    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}