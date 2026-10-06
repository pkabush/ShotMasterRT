import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../../../classes/Shot";
import EditableJsonTextField from "../../../../../EditableJsonTextField";
import SettingsButton from "../../../../../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../../../../../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../../../../../classes/AI_provider";
import LoadingSpinner from "../../../../../Atomic/LoadingSpinner";


interface Props {
    shot: Shot;
}

const wf_name = "shot_previs_generate_shotsJSON"
const wf_prompt_field = `workflows/${wf_name}/prompt`
const wf_loading = `${wf_name}/loading`

// Prompt
const PromptField: React.FC<Props> = observer(({ shot }) => {
    return <>
        <EditableJsonTextField localJson={shot.scene.project.projinfo} field={wf_prompt_field} />
    </>;
})
const get_prompt = (shot: Shot): string => {
    return shot.scene.project.projinfo?.getField(wf_prompt_field);
}


const component: React.FC<Props> = observer(({ shot }) => {
    const loading = shot.shotJson?.getField(wf_loading) ?? false;

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => { Action_Previs_GenerateShotsJson(shot); }} >
                        Generate Shotlist
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    <LoadingSpinner isLoading={loading} asButton />
                </>
            }
            content={
                <>
                    <PromptField shot={shot} />
                </>
            }
        />
    </div >
})

export async function Action_Previs_GenerateShotsJson(shot: Shot) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const messages = [
            get_prompt(shot) ?? "",
            shot.shotJson?.data.previs_script as string,
        ]

        const res = await AI.sendMessages(
            messages,
            workflow.model ?? AllTextModels[0],
        )

        if (typeof res === "string") {
            await shot.shotJson!.updateField("previs_json", res);
        }
    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}

export const WF_Previs_GenerateShotsJSON = {
    wf_name,
    wf_loading,
    component,
}






