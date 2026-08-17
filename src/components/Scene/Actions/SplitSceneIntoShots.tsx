import { observer } from "mobx-react-lite";
import type { Scene } from "../../../classes/Scene";
import SettingsButton from "../../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../../classes/AI_provider";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Button } from "react-bootstrap";
import { CollapsibleContainerAccordion } from "../../Atomic/CollapsibleContainer";
import EditableJsonTextField from "../../EditableJsonTextField";
import { runInAction } from "mobx";


interface Props {
    scene: Scene;
}

export const SplitSceneIntoShotsButton: React.FC<Props> = observer(({ scene }) => {

    const handleCreateShots = async () => {
        scene.createShotsFromShotsJson();
    };

    const split_into_shots_wf_name = "split_scene_into_shots"

    return <SettingsButton className="mb-2"
        buttons={
            <>
                {/**Button */}
                <button className="btn btn-sm btn-outline-success" onClick={async () => {
                    ActionSceneGenerateShotsJson(scene);
                }}> Split Into Shots </button>

                {/* Model Selector */}
                <WorkflowOptionSelect
                    workflowName={split_into_shots_wf_name}
                    optionName={"model"}
                    values={AllTextModels}
                />

                {/**Loading Spinner */}
                <LoadingSpinner isLoading={scene.is_generating_shotsjson} asButton />
            </>
        }
        content={
            <>
                <Button onClick={handleCreateShots} size="sm" className="mb-2">Create Shots From Json</Button>
                <CollapsibleContainerAccordion label="Prompt" defaultCollapsed={true}>
                    <div className="p-2">

                        <EditableJsonTextField localJson={scene.project.projinfo} field="workflows/split_scene_into_shots/system_message" fitHeight collapsed={true} />
                        <EditableJsonTextField localJson={scene.project.projinfo} field="workflows/split_scene_into_shots/prompt" fitHeight collapsed={true} />
                        <EditableJsonTextField localJson={scene.sceneJson} field="split_prompt" fitHeight />
                    </div>
                </CollapsibleContainerAccordion>
                <EditableJsonTextField localJson={scene.sceneJson} field="shotsjson" fitHeight collapsed={true} />
            </>
        }
    />

})

export async function ActionSceneGenerateShotsJson(scene: Scene): Promise<string | null> {
    if (!scene.sceneJson || !scene.sceneJson?.data?.script) return null;
    runInAction(() => { scene.is_generating_shotsjson = true; });

    const wf_name = "split_scene_into_shots"
    const workflow = scene.project.workflows[wf_name]


    const scriptText = scene.sceneJson.data.script;

    const prompt = `
${workflow.prompt}

${scene.sceneJson.data.split_prompt}

SCRIPT:
${scriptText}
`;

    const system_msg = workflow.system_message

    try {
        const res = await AI.GenerateText({
            system: system_msg,
            prompt: prompt,
            model: workflow.model ?? AllTextModels[0],
        })

        await scene.sceneJson?.updateField("shotsjson", res);

        return res;
    } catch (err) {
        console.error("Error generating shots JSON:", err);
        return null;
    } finally {
        runInAction(() => { scene.is_generating_shotsjson = false; });
    }
}