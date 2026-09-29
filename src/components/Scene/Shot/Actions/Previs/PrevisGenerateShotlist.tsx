
import type { Shot } from "../../../../../classes/Shot";
import { observer } from "mobx-react-lite";
import SettingsButton from "../../../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../../../../classes/AI_provider";
import LoadingSpinner from "../../../../Atomic/LoadingSpinner";


interface Props {
    shot: Shot;
}

const wf_name = "shot_previs_generate_shotlist"
const wf_loading = `${wf_name}/loading`


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
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                </>
            }
        />
    </div >
})

export async function Action_Previs_GenerateShotlist(shot: Shot) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const prompt = `
            ${workflow.prompt ?? ""}
        
            ${shot.shotJson?.data.previs_script}
            `;

        const res = await AI.GenerateText({
            prompt,
            model: workflow.model ?? AllTextModels[0],
        });

        await shot.shotJson!.updateField("previs_shots", res);

    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }

    //await ActionGenerateReferences(shot);
}

export const WF_Previs_GenerateShotlist = {
    wf_name,
    wf_loading,
    component,
}






