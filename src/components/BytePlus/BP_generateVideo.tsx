import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField, { EditableJsonBooleanSelect, EditableJsonToggleField } from "../EditableJsonTextField";
import { SeedanceAI } from "../../classes/AiProviders/Byteplus";
import { ai_providers } from "../../classes/AI_provider";
import { MediaFolderGallery } from "../MediaFolderGallery";
import { TagsFolderContainer } from "../FolderTags/FolderTagsContainer";
import { Project } from "../../classes/Project";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { LocalAudio } from "../../classes/fileSystem/LocalAudio";
import { runInAction } from "mobx";
import { ShotStartEndFramePreview } from "../Kling/Kling_GenerateVideo";

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
    const draft_field = `workflows/${wf_name}/draft_mode`;

    return (
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Generate Video Button */}
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            runInAction(() => {
                                shot.is_submitting_video = true;
                            });

                            try {
                                const content = []

                                // Add Prompt                            
                                const prompt = (shot.shotJson?.data.generated_video_prompt || shot.shotJson?.data.video_prompt) || "";
                                if (prompt) content.push(SeedanceAI.textMsg(prompt))

                                // Add First Frame
                                if (shot.first_frame) {
                                    content.push(
                                        await SeedanceAI.imgMsg(
                                            shot.first_frame,
                                            'first_frame'
                                        )
                                    )
                                }

                                // Add last Frame
                                if (shot.end_frame) {
                                    content.push(
                                        await SeedanceAI.imgMsg(
                                            shot.end_frame,
                                            "last_frame"
                                        )
                                    )
                                }

                                // References
                                const references = shot.references?.active_images ?? []
                                console.log(references);
                                for (const reference of references) {
                                    content.push(
                                        await SeedanceAI.imgMsg(
                                            reference,
                                            "reference_image"
                                        )
                                    )
                                }

                                // Audio Refs
                                const audio_refs = await shot.references?.getActiveType(LocalAudio) ?? []
                                for (const audio_ref of audio_refs) {
                                    const base64 = await audio_ref.getBase64();
                                    content.push(
                                        SeedanceAI.audioMsg(
                                            `data:${base64.mime};base64,${base64.rawBase64}`,
                                        )
                                    )
                                }

                                // TODO Video
                                let has_video = false;
                                const video_refs = await shot.references?.getActiveType(LocalVideo) ?? []
                                for (const video_ref of video_refs) {
                                    const webUrl = await video_ref.getWebUrl();
                                    content.push(
                                        SeedanceAI.videoMsg(webUrl)
                                    )
                                    has_video = true;
                                }

                                const result = await SeedanceAI.generateVideo({
                                    content,
                                    model: project.workflows[wf_name].model ?? SeedanceAI.options.video.models["seed_2.0"],
                                    generate_audio: project.projinfo!.getField(gen_audio_field) ?? false,
                                    resolution: project.workflows[wf_name].resolution,
                                    duration: project.workflows[wf_name].duration ? Number(project.workflows[wf_name].duration) : undefined,
                                    ratio: project.workflows[wf_name].aspect_ratio ?? SeedanceAI.options.video.ration.adaptive,
                                    draft: project.projinfo!.getField(draft_field) ?? false,
                                });

                                if (!result) return;

                                shot.tasksJson!.addTask(result.id, {
                                    provider: ai_providers.BD,
                                    geninfo: {
                                        generate_audio: project.projinfo!.getField(gen_audio_field) ?? false,
                                        model: project.workflows[wf_name].model ?? SeedanceAI.options.video.models["seed_2.0"],
                                        resolution: project.workflows[wf_name].resolution,
                                        duration: project.workflows[wf_name].duration ? Number(project.workflows[wf_name].duration) : undefined,
                                        ratio: project.workflows[wf_name].aspect_ratio ?? SeedanceAI.options.video.ration.adaptive,
                                        draft: project.projinfo!.getField(draft_field) ?? false,                                        
                                        has_video,
                                    }
                                })

                            } catch (err) {
                                console.error("Submitting Video Generation Failed:", err);
                            } finally {
                                runInAction(() => { shot.is_submitting_video = false; });
                            }
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
                    <WorkflowOptionSelect
                        project={project}
                        workflowName={wf_name}
                        optionName="model"
                        label="Model:"
                        values={Object.values(SeedanceAI.options.video.models)}
                        defaultValue={SeedanceAI.options.video.models["seed_2.0"]}
                    />

                    <EditableJsonBooleanSelect field={draft_field} localJson={project.projinfo} label="Draft" />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
                </>
            }
            content={
                <>
                    <EditableJsonToggleField localJson={project.projinfo} field={gen_audio_field} default_val={false} label="Sound" />

                    <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
                    <EditableJsonTextField localJson={shot.shotJson} field="generated_video_prompt" fitHeight />
                    <TagsFolderContainer tags={shot.references} folders={[
                        Project.getProject(),
                        Project.getProject().artbook as LocalFolder,
                        shot as LocalFolder
                    ]} />


                    <ShotStartEndFramePreview shot={shot} />

                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} />

                </>
            }
        />
    );
});
