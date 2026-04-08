import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import MediaGalleryPreview from "../MediaComponents/MediaGallerPreview";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import { AI, AllTextModels } from "../../classes/AI_provider";
import { Project } from "../../classes/Project";

interface Google_GenerateKlingPromptProps {
    shot: Shot;
}

export const Google_GenerateKlingPrompt: React.FC<Google_GenerateKlingPromptProps> = observer(({ shot }) => {
    const wf_name = "Generate_KlingVideoPrompt"
    const project = Project.getProject()
    const kling_docs = "docs/kling/video_api"

    return (
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Generate Video Button */}
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            console.log("Generate Shot Prompt");

                            const workflow = project.workflows[wf_name] ?? ""

                            const prompt = `
                                Kling Prompting Guide:
                                ${project.projinfo?.getField(kling_docs)}


                                ${workflow.prompt} 
                                
                                ${shot.shotJson?.getField("video_prompt")}
                            `

                            const images = []

                            if (shot.srcImage) {
                                const base64Obj = await shot.srcImage.getBase64();
                                images.push({
                                    rawBase64: base64Obj.rawBase64,
                                    mime: base64Obj.mime,
                                    description: "first_frame",
                                });                                
                            }

                            if (shot.end_frame) {
                                const base64Obj = await shot.end_frame.getBase64();
                                images.push({
                                    rawBase64: base64Obj.rawBase64,
                                    mime: base64Obj.mime,
                                    description: "end_frame",
                                });
                            }

                            console.log(images);
                            const res = await AI.GenerateText({
                                prompt: prompt,
                                model: workflow.model!,
                                images: images,
                            })

                            if (res) {
                                shot.shotJson!.updateField("generated_video_prompt", res);
                            }

                        }}
                    >
                        Generate Prompt
                    </button>

                    {/* Model Selector */}
                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    {/** Previews */}
                    <MediaGalleryPreview mediaItem={shot.srcImage as LocalMedia} height={200} />
                    <MediaGalleryPreview mediaItem={shot.end_frame as LocalMedia} height={200} />
                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} defaultCollapsed={true} />

                    <EditableJsonTextField localJson={shot.scene.project.projinfo} field={kling_docs} fitHeight collapsed={true} />
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />

                    <EditableJsonTextField localJson={shot.shotJson} field="generated_video_prompt" fitHeight />
                </>
            }
        />
    );
});
