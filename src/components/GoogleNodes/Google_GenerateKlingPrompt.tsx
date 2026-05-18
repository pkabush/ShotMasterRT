import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
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


                            //let source_prompt = shot.shotJson?.getField("kling_source_prompt")
                            //if (!source_prompt) {
                            //    const source_prompt = shot.shotJson?.getField("video_prompt")
                            //    shot.shotJson!.updateField("kling_source_prompt", source_prompt);
                            //}
                            let source_prompt = shot.shotJson?.getField("video_prompt")

                            const prompt = `
                                Kling Prompting Guide:
                                ${project.projinfo?.getField(kling_docs)}

                                ${workflow.prompt} 
                                
                                ${source_prompt}
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
                                //shot.shotJson!.updateField("video_prompt", res);
                                shot.shotJson!.updateField("generated_video_prompt", res);
                                //swap_prompts();
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

                </>
            }
            content={
                <>
                    <EditableJsonTextField localJson={shot.scene.project.projinfo} field={kling_docs} fitHeight collapsed={true} />
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                </>
            }
        />
    );
});
