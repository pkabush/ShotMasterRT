import { observer } from "mobx-react-lite";
import type { Scene } from "../../../classes/Scene";
import SettingsButton from "../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../WorkflowOptionSelect";
import { AI, AllImageModels, AllTextModels } from "../../../classes/AI_provider";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Button, ListGroup } from "react-bootstrap";
import EditableJsonTextField from "../../EditableJsonTextField";
import { parseMissingRefsJson } from "../Shot/Actions/ShotGenerateMissingReferences";
import { LocalImage } from "../../../classes/fileSystem/LocalImage";
import { GoogleAI } from "../../../classes/GoogleAI";
import type { LocalFolder } from "../../../classes/fileSystem/LocalFolder";





const wf_name = "scene_generate_items_references"
const wf_loading = `${wf_name}/loading`
const wf_name_genImages = `${wf_name}_image_generation`
const wf_loading_images = `${wf_name_genImages}/loading`
const wf_output = `${wf_name}/image_prompts`

interface Props {
    scene: Scene;
}

export const SceneGenerateItemReferencesComponent: React.FC<Props> = observer(({ scene }) => {
    const loading = scene.sceneJson?.getField(wf_loading) ?? false;
    const loading_images = scene.sceneJson?.getField(wf_loading_images) ?? false;

    const missingRefs = parseMissingRefsJson(scene.sceneJson?.getField(wf_output));

    return <div>
        <SettingsButton
            className="mb-2 mt-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            console.log("GENERATE DESCRIPTIONS")
                            ActionSceneGenerateMissingItemImagePrompts(scene);
                        }} >
                        Generate Item Reference Descriptions
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
                            console.log("Generate Images")
                            ActionSceneGenerateMissingItemImages(scene);
                        }}
                    >
                        Generate Images
                    </Button>

                    <Button size="sm" variant={missingRefs ? "success" : "outline-secondary"}>
                        Images: {missingRefs?.length ?? 0}
                    </Button>

                    <WorkflowOptionSelect
                        workflowName={wf_name_genImages}
                        optionName={"model"}
                        values={AllImageModels}
                    />

                    <LoadingSpinner isLoading={loading_images} asButton />

                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={scene.sceneJson} field={wf_output} />


                    <br />
                    REFS:
                    {!missingRefs ? (
                        <span className="badge bg-danger ms-2">
                            CANT PARSE JSON
                        </span>
                    ) : (
                        <ListGroup>
                            {missingRefs.map((ref) => (
                                <ListGroup.Item key={ref.name}>
                                    {ref.name}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                    <br />

                    {/*<MediaFolderGallery mediaFolder={scene} /> */}


                </>
            }
        />
    </div>;
});



async function ActionSceneGenerateMissingItemImagePrompts(scene: Scene) {
    scene.sceneJson?.updateField(`${wf_name}/loading`, true);

    try {
        const workflow = scene.project.workflows[wf_name];

        const prompt = `
${workflow.prompt ?? ""}

Script:
${scene.sceneJson?.data.script}

`;
        const res = await AI.GenerateText({
            prompt,
            model: workflow.model ?? AllTextModels[0],
        });

        await scene.sceneJson!.updateField(wf_output, res);

    } finally {
        scene.sceneJson?.updateField(wf_loading, false);
    }

    await ActionSceneGenerateMissingItemImages(scene);
}


export async function ActionSceneGenerateMissingItemImages(scene: Scene) {
    const project = scene.project;
    const dataJson = scene.sceneJson;

    dataJson?.updateField(`${wf_name_genImages}/loading`, true);

    try {
        const missingRefs = parseMissingRefsJson(dataJson?.getField(wf_output));

        if (missingRefs === null) {
            console.error(
                "Cannot generate references: invalid missing references JSON"
            );
            return;
        }

        console.log("Generating missing images");

        await Promise.all(
            missingRefs.map(async (reference) => {
                const name = reference.name;
                const prompt = reference.prompt;

                const model =
                    project.workflows[wf_name_genImages]?.model ??
                    AllImageModels[0];

                console.log("Generating Missing reference:", {
                    reference,
                    model,
                    name,
                });

                const res = await AI.GenerateImage({
                    prompt,
                    model,
                });

                if (res) {
                    res.id = name.replaceAll(" ", "_");
                }

                const localImage: LocalImage | null =
                    await GoogleAI.saveResultImage(
                        res,
                        scene as LocalFolder,
                    );

                if (localImage) {
                    scene.references?.addTag(localImage);
                }

                return localImage;
            })
        );
    } finally {
        dataJson?.updateField(`${wf_name_genImages}/loading`, false);
    }
}