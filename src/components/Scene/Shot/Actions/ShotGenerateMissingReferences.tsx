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
import LoadingSpinner from "../../../Atomic/LoadingSpinner";

interface Props {
    shot: Shot;
}

const wf_name = "sc_find_refs_to_generate"
const use_images_field = `workflows/${wf_name}/use_images`;
const output = "sc_find_refs_to_generate_output"
const wf_name_genImages = "sc_generate_missing_refs"
const wf_loading = `${wf_name}/loading`
const wf_loading_images = `${wf_name_genImages}/loading`

export const WF_ShotGenerateMissingReferences = {
    wf_name,
    use_images_field,
    output,
    wf_name_genImages,
    wf_loading,
    wf_loading_images,
}


export const ShotGenerateMissingReferencesButton: React.FC<Props> = observer(({ shot }) => {
    const project = shot.scene.project;

    const missingRefs = parseMissingRefsJson(shot);
    const loading = shot.shotJson?.getField(wf_loading) ?? false;
    const loading_images = shot.shotJson?.getField(wf_loading_images) ?? false;

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            await ActionShotGenerateMissingReferencesDescription(shot);
                        }} >
                        Generate Descriptions
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
                        onClick={() => ActionGenerateReferences(shot)}
                    >
                        Generate References
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
                    <EditableJsonToggleField localJson={project.projinfo} field={use_images_field} default_val={false} label="Add References As Images" />
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={shot.shotJson} field={output} />

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


                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} />


                </>
            }
        />
    </div>;
});

type MissingReference = {
    name: string;
    prompt: string;
    sourceReferences: string[];
    [key: string]: unknown;
};

function parseMissingRefsJson(shot: Shot): MissingReference[] | null {
    const value = shot.shotJson?.getField(output);

    if (typeof value !== "string") {
        return null;
    }

    try {
        const parsed = JSON.parse(value);

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !Array.isArray(parsed.missingReferences)
        ) {
            return null;
        }

        const valid = parsed.missingReferences.every((ref: unknown) => {
            if (typeof ref !== "object" || ref === null) {
                return false;
            }

            const reference = ref as Record<string, unknown>;

            return (
                typeof reference.name === "string" &&
                typeof reference.prompt === "string" &&
                Array.isArray(reference.sourceReferences) &&
                reference.sourceReferences.every(
                    (source: unknown) => typeof source === "string"
                )
            );
        });

        if (!valid) {
            return null;
        }

        return parsed.missingReferences as MissingReference[];
    } catch {
        return null;
    }
}

export async function ActionShotGenerateMissingReferencesDescription(shot: Shot) {
    shot.shotJson?.updateField(`${wf_name}/loading`, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const prompt = `
${workflow.prompt ?? ""}

Description:
${shot.shotJson?.data.description}

Paths to references I Already have:
${shot.references?.get_active_tags.join("\n")}
`;

        const use_images =
            shot.scene.project.projinfo!.getField(use_images_field) ?? false;

        const refs = await shot.scene.references?.GetAI_Images();

        const res = await AI.GenerateText({
            prompt,
            model: workflow.model ?? AllTextModels[0],
            images: use_images ? refs : undefined,
        });

        await shot.shotJson!.updateField(output, res);

    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }

    await ActionGenerateReferences(shot);
}

export async function ActionGenerateReferences(shot: Shot) {
    const project = shot.scene.project;

    shot.shotJson?.updateField(`${wf_name_genImages}/loading`, true);

    try {
        const missingRefs = parseMissingRefsJson(shot);

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
                const sourceReferences = reference.sourceReferences;

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
    } finally {
        shot.shotJson?.updateField(`${wf_name_genImages}/loading`, false);
    }
}