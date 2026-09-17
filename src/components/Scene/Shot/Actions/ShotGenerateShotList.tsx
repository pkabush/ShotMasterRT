import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import SettingsButton from "../../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../../../classes/AI_provider";
import LoadingSpinner from "../../../Atomic/LoadingSpinner";
import EditableJsonTextField from "../../../EditableJsonTextField";

const wf_name = "shot_generate_shotlist"
const wf_output = `${wf_name}/output`
const wf_loading = `${wf_name}/loading`

interface Props {
    shot: Shot;
}

export const WF_ShotGenerateShotlist = {
    wf_name,
    wf_output,
    wf_loading,
    run:ActionGenerateShotlist
}



export const ShotGenerateShotlist: React.FC<Props> = observer(({ shot }) => {

    const loading = shot.shotJson?.getField(wf_loading) ?? false;

    const first_shot = shot.scene.shots_ordered.indexOf(shot) === 0;

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            ActionGenerateShotlist(shot);
                        }} >
                        Generate Shotlist
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect workflowName={wf_name} optionName={"model"} values={AllTextModels} />

                    <LoadingSpinner isLoading={loading} asButton />

                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={first_shot ? wf_name : wf_name + "_next" } optionName={"prompt"} />
                    <EditableJsonTextField localJson={shot.shotJson} field={wf_output} />
                </>
            }
        />
    </div>;
});


export async function ActionGenerateShotlist(shot: Shot) {
    const project = shot.scene.project;
    const shot_index = shot.scene.shots_ordered.indexOf(shot)
    const first_shot = shot_index === 0;

    shot.shotJson?.updateField(wf_loading, true);

    try {


        const workflow = shot.scene.project.workflows[ first_shot ? wf_name : wf_name + "_next" ];

        const prompt = `
        ${workflow.prompt ?? ""}

        Generation Description:
        ${shot.shotJson?.data.description}

        ${first_shot ? "" : 'Previous Shotlist:\n' + shot.scene.shots_ordered[shot_index-1].shotJson?.getField( wf_output ) }
`;


        const model =
            project.workflows[wf_name].model ??
            AllTextModels[0];

        const res = await AI.GenerateText({
            prompt,
            model,
        });


        await shot.shotJson!.updateField(wf_output, res);


    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}