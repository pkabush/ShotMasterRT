import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField, { EditableJsonToggleField } from "../EditableJsonTextField";
import { SeedanceAI } from "../../classes/AiProviders/Byteplus";
import { ai_providers } from "../../classes/AI_provider";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import MediaGalleryPreview from "../MediaComponents/MediaGallerPreview";
import { TagsFolderContainer } from "../FolderTags/FolderTagsVide";
import { Project } from "../../classes/Project";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";

// Video Gen Parameters
// https://docs.byteplus.com/en/docs/ModelArk/1520757

// Model List
// https://docs.byteplus.com/en/docs/ModelArk/1330310#video-generation




interface BytePlus_GenerateVideoProps {
    shot: Shot;
}

export const BytePlus_GenerateVideo: React.FC<BytePlus_GenerateVideoProps> = observer(({ shot }) => {

    const project = Project.getProject();
    const wf_name = "seedance_gen_video";
    const gen_audio_field = `workflows/${wf_name}/generate_audio`;

    return (
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Generate Video Button */}
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            const content = []

                            // Add Prompt
                            const prompt = shot.shotJson?.getField("video_prompt")
                            if (prompt) content.push(SeedanceAI.textMsg(prompt))

                            // Add First Frame
                            if (shot.start_frame) {
                                const first_frame = await shot.start_frame.getBase64();
                                content.push(
                                    SeedanceAI.imgMsg(
                                        `data:${first_frame.mime};base64,${first_frame.rawBase64}`,
                                        'first_frame'
                                    )
                                )
                            }

                            // Add last Frame
                            if (shot.end_frame) {
                                const base64 = await shot.end_frame.getBase64();
                                content.push(
                                    SeedanceAI.imgMsg(
                                        `data:${base64.mime};base64,${base64.rawBase64}`,
                                        "last_frame"
                                    )
                                )
                            }

                            // References
                            const references = await shot.references?.GetAI_Images() ?? []
                            for (const reference of references) {
                                content.push(
                                    SeedanceAI.imgMsg(
                                        `data:${reference.mime};base64,${reference.rawBase64}`,
                                        "reference_image"
                                    )
                                )
                            }

                            // TODO Video
                            // TODO Audio


                            const result = await SeedanceAI.generateVideo({
                                content,
                                generate_audio: project.projinfo!.getField(gen_audio_field) ?? false,
                                resolution: project.workflows[wf_name].resolution,
                                duration: project.workflows[wf_name].duration ? Number(project.workflows[wf_name].duration) : undefined,                                
                                ratio:  project.workflows[wf_name].aspect_ratio ?? SeedanceAI.options.video.ration.adaptive
                            });

                            if (!result) return;
                            const task = shot.addTask(result.id, {
                                provider: ai_providers.BD,
                            })
                            await new Promise(res => setTimeout(res, 100));
                            task.check_status();
                        }}
                    >
                        Generate Seedance Video
                    </button>

                    <WorkflowOptionSelect
                        project={project}
                        workflowName={wf_name}
                        optionName="resolution"
                        label="resolution"
                        values={Object.values(SeedanceAI.options.video.resolution)}                        
                    />
                    <WorkflowOptionSelect
                        project={project}
                        workflowName={wf_name}
                        optionName="duration"
                        label="duration"
                        values={Object.values(SeedanceAI.options.video.duration)}
                        defaultValue={SeedanceAI.options.video.duration.default}
                    />
                    <WorkflowOptionSelect
                        project={project}
                        workflowName={wf_name}
                        optionName="aspect_ratio"
                        label="Ratio:"
                        values={Object.values(SeedanceAI.options.video.ration)}
                        defaultValue={SeedanceAI.options.video.ration.adaptive}
                    />



                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
                </>
            }
            content={
                <>
                    <EditableJsonToggleField localJson={project.projinfo} field={gen_audio_field} default_val={false} label="Sound" />
                    <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
                    <TagsFolderContainer tags={shot.references} folders={[Project.getProject(), Project.getProject().artbook as LocalFolder]} />
                    <MediaGalleryPreview mediaItem={shot.srcImage as LocalMedia} height={200} />
                    <MediaGalleryPreview mediaItem={shot.end_frame as LocalMedia} height={200} />
                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} />

                </>
            }
        />
    );
});
