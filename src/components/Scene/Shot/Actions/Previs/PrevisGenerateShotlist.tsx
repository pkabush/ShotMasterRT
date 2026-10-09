
import type { Shot } from "../../../../../classes/Shot";
import { observer } from "mobx-react-lite";
import SettingsButton from "../../../../Atomic/SettingsButton";
import LoadingSpinner from "../../../../Atomic/LoadingSpinner";
import EditableJsonTextField from "../../../../EditableJsonTextField";
import { AI } from "../../../../../classes/AiProviders/AI_Generic";
import { WorkflowTextModelSelect } from "../../../../../classes/AiProviders/AI_Generic_Components";

interface Props {
    shot: Shot;
}

const wf_name = "shot_previs_generate_shotlist"
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
                        onClick={async () => {
                            console.log("Generate Staging Dscription");
                            Action_Previs_GenerateShotlist(shot);
                        }} >
                        Generate Shotlist
                    </button>

                    {/* Model Selector */}
                    <WorkflowTextModelSelect workflowName={wf_name} />

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

export async function Action_Previs_GenerateShotlist(shot: Shot) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        /*
        const messages = get_use_prev_shot(shot) ? [
            "Previous Storyboard Description",
            shot.prevShot?.shotJson?.getField("previs_shots") as string,
            "Previous Storyboard",
            shot.prevShot?.srcImage ?? "",
            get_prompt(shot) ?? "",
            shot.shotJson?.data.previs_script as string,
        ] : [
            get_prompt(shot) ?? "",
            shot.shotJson?.data.previs_script as string,
        ]
            */
        const messages = [
            get_prompt(shot) ?? "",
            shot.shotJson?.data.previs_script as string,
        ]

        const res = await AI.sendMessages(
            messages,
            workflow.model,            
        )

        if (typeof res === "string") {
            await shot.shotJson!.updateField("previs_shots", res);
        }
    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}

export const WF_Previs_GenerateShotlist = {
    wf_name,
    wf_loading,
    component,
}






