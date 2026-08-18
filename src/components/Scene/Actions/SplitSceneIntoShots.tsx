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

const wf_name = "split_scene_into_shots"
const wf_loading = `${wf_name}/loading`



export const SplitSceneIntoShotsButton: React.FC<Props> = observer(({ scene }) => {

    const loading = scene.sceneJson?.getField(wf_loading) ?? false;

    const shots = parseShotsJson(scene);

    return <SettingsButton className="mb-2"
        buttons={
            <>
                {/**Button */}
                <button className="btn btn-sm btn-outline-success" onClick={async () => {
                    ActionSceneGenerateShotsJson(scene);
                }}> Generate Shot Descriptions</button>

                {/* Model Selector */}
                <WorkflowOptionSelect
                    workflowName={wf_name}
                    optionName={"model"}
                    values={AllTextModels}
                />

                {/**Loading Spinner */}
                <LoadingSpinner isLoading={loading} asButton />

                <Button size="sm" variant={shots ? "success" : "outline-secondary"}>
                    Shots: {Object.keys(shots ?? {}).length}
                </Button>

                <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => { ActionSceneCreateShotsFromJson(scene); }}
                >Create Shots</Button>
            </>
        }
        content={
            <>
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

    runInAction(() => { scene.sceneJson?.updateField(wf_loading, true); });

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
        runInAction(() => {
            scene.sceneJson?.updateField(wf_loading, false);
        });
    }
}

export function parseShotsJson(
    scene: Scene
): Record<string, Record<string, any>> | null {
    try {
        const shotsJson = scene.sceneJson?.data?.shotsjson;

        if (!shotsJson) {
            console.warn("No shots JSON found in scene.");
            return null;
        }

        const parsed: unknown = JSON.parse(shotsJson);

        // Must be a non-null object and not an array
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return null;
        }

        const shots = parsed as Record<string, unknown>;

        // Every shot must be an object
        for (const [shotKey, shotInfo] of Object.entries(shots)) {
            if (
                typeof shotKey !== "string" ||
                !shotInfo ||
                typeof shotInfo !== "object" ||
                Array.isArray(shotInfo)
            ) {
                return null;
            }
        }

        return shots as Record<string, Record<string, any>>;
    } catch (err) {
        //console.error("Invalid shots JSON:", err);
        return null;
    }
}

export async function ActionSceneCreateShotsFromJson(scene: Scene) {
    const shotsData = parseShotsJson(scene);

    if (!shotsData) {
        alert("Error: The shots JSON is invalid. Please check the format.");
        return;
    }

    for (const [shotKey, shotInfo] of Object.entries(shotsData)) {
        try {
            const shot = await scene.createShot(shotKey);

            if (!shot) {
                console.error(`Failed to create shot ${shotKey}`);
                continue;
            }

            if (shot.shotJson) {
                Object.assign(shot.shotJson.data, shotInfo);
                await shot.shotJson.save();
            }
        } catch (err) {
            console.error(`Error creating shot ${shotKey}:`, err);
        }
    }
}