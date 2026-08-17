import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import SettingsButton from "../../../Atomic/SettingsButton";
import { AI, AllImageModels, AllTextModels } from "../../../../classes/AI_provider";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../WorkflowOptionSelect";
import EditableJsonTextField, { EditableJsonToggleField } from "../../../EditableJsonTextField";
import { Button, ListGroup } from "react-bootstrap";
import { LocalImage } from "../../../../classes/fileSystem/LocalImage";
import { GoogleAI } from "../../../../classes/GoogleAI";
import type { LocalFolder } from "../../../../classes/fileSystem/LocalFolder";
import { MediaFolderGallery } from "../../../MediaFolderGallery";


interface Props {
    shot: Shot;
}

const wf_name = "sc_find_refs_to_generate"
const use_images_field = `workflows/${wf_name}/use_images`;
const output = "sc_find_refs_to_generate_output"

const wf_name_genImages = "sc_generate_missing_refs"

export const ShotGenerateMissingReferencesButton: React.FC<Props> = observer(({ shot }) => {
    const project = shot.scene.project;

    const missingRefs = getMissingReferences(shot);

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            await ActionShotGenerateMissingReferences(shot);
                        }} >
                        Generate Missing References
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    {/*<LoadingSpinner isLoading={shot.is_generating_tags} asButton /> */}
                </>
            }
            content={
                <>

                    <EditableJsonToggleField localJson={project.projinfo} field={use_images_field} default_val={false} label="Add References As Images" />
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={shot.shotJson} field={output} />

                    <br />
                    REFS:
                    <ListGroup>
                        {missingRefs.map((ref) => (
                            <ListGroup.Item key={ref.name}>{ref.name}</ListGroup.Item>
                        ))}
                    </ListGroup>

                    <br />

                    <SettingsButton
                        buttons={<>
                            <Button
                                size="sm"
                                variant="outline-success"
                                onClick={async () => {
                                    const ref_json = shot.shotJson?.getField(output);
                                    console.log("Generating missing images");

                                    if (typeof ref_json !== "string") {
                                        console.log("ref_json is not a string");
                                        return;
                                    }
                                    try {
                                        const parsed: unknown = JSON.parse(ref_json);

                                        if (
                                            typeof parsed === "object" &&
                                            parsed !== null &&
                                            "missingReferences" in parsed &&
                                            Array.isArray(parsed.missingReferences)
                                        ) {
                                            await Promise.all(
                                                parsed.missingReferences.map(async (reference) => {
                                                    const name = reference.name as string;
                                                    const prompt = reference.prompt as string;
                                                    const sourceReferences = reference.sourceReferences as string[];

                                                    const images = (
                                                        await Promise.all(
                                                            sourceReferences.map(async (ref) => {
                                                                const image = shot.getByAbsPath(ref, LocalImage);
                                                                if (!image) return undefined;

                                                                const base64Obj = await image.getBase64();

                                                                return {
                                                                    rawBase64: base64Obj.rawBase64,
                                                                    mime: base64Obj.mime,
                                                                    description: image.path,
                                                                };
                                                            })
                                                        )
                                                    ).filter((image) => image !== undefined);

                                                    const model =
                                                        project.workflows[wf_name_genImages].model ??
                                                        AllImageModels[0];

                                                    console.log("Generating Missing reference:", {
                                                        reference,
                                                        model,
                                                        name,
                                                    });

                                                    const res = await AI.GenerateImage({
                                                        prompt,
                                                        model,
                                                        images,
                                                    });

                                                    if (res) {
                                                        res.id = name.replaceAll(" ", "_");
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
                                                })
                                            );
                                        }

                                    } catch (error) {
                                        console.log("Invalid JSON", error);
                                    }

                                }}
                            > Generate References </Button>

                            <WorkflowOptionSelect
                                workflowName={wf_name_genImages}
                                optionName={"model"}
                                values={AllImageModels}
                            />

                        </>

                        }

                        content={<>

                        </>}
                    >


                    </SettingsButton>
                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} />


                </>
            }
        />
    </div>;
});

function getMissingReferences(shot: Shot): any[] {
    const value = shot.shotJson?.getField(output);

    if (typeof value !== "string") {
        return [];
    }

    try {
        const parsed = JSON.parse(value);

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !Array.isArray(parsed.missingReferences)
        ) {
            return [];
        }

        return parsed.missingReferences;
    } catch {
        return [];
    }
}



export async function ActionShotGenerateMissingReferences(shot: Shot) {
    const wf_name = "sc_find_refs_to_generate"
    const output = "sc_find_refs_to_generate_output"

    const workflow = shot.scene.project.workflows[wf_name]



    const prompt = `
${workflow.prompt ?? ""}

Desctiption:
${shot.shotJson?.data.description}

Paths to references I Already have:
${shot.references?.get_active_tags.join("\n")}
`;

    const use_images = shot.scene.project.projinfo!.getField(use_images_field) ?? false
    const refs = await shot.scene.references?.GetAI_Images();

    const res = await AI.GenerateText({
        prompt: prompt,
        model: workflow.model ?? AllTextModels[0],
        images: use_images ? refs : undefined,
    })


    await shot.shotJson!.updateField(output, res);
}




