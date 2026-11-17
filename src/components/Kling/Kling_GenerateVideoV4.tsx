import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { KlingAI } from "../../classes/KlingAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField, { EditableJsonToggleButton } from "../EditableJsonTextField";
import { Button, Stack } from "react-bootstrap";
import { ShotStartEndFramePreview } from "./Kling_GenerateVideo";
import { TagsFolderContainer } from "../FolderTags/FolderTagsContainer";
import { Project } from "../../classes/Project";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";

interface Kling_GenerateVideoProps {
    shot: Shot;
}


export const Kling_GenerateVideoV4: React.FC<Kling_GenerateVideoProps> = observer(({ shot }) => {
    const project = shot.scene.project;


    return (
        <>
            <Stack direction="horizontal" className="mb-1">
                <h4 className="me-4">Images</h4>
                <EditableJsonToggleButton localJson={project.projinfo} field={"auto_load_first_frame"} default_val={false} label="Auto Load First Frame" />
            </Stack>

            <ShotStartEndFramePreview shot={shot} />

            <TagsFolderContainer tags={shot.references} folders={[
                Project.getProject(),
                Project.getProject().artbook as LocalFolder,
                shot as LocalFolder
            ]} />

            <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" defaultCollapsed={true} />

            <h4 className="mt-3">Prompt</h4>
            <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />


            <h4 className="mt-3">Generate | Tasks | Results</h4>


            <SettingsButton
                className="mb-2"
                buttons={
                    <>
                        <Button
                            variant="outline-success"
                            size="sm"
                            onClick={async () => {
                                console.log("Generate Video Kling V4", { shot });

                                const workflow = shot.scene.project.workflows.generate_video_kling_v4;

                                const prompt = shot.shotJson?.data.video_prompt;

                                let frames: Array<{
                                    type: "first_frame" | "middle_frame" | "last_frame";
                                    url: string;
                                }> = [];


                                if (shot.first_frame) {
                                    frames.push({
                                        url: (await shot.first_frame.getBase64()).rawBase64,
                                        type: "first_frame",
                                    });
                                }

                                if (shot.end_frame) {
                                    frames.push({
                                        url: (await shot.end_frame.getBase64()).rawBase64,
                                        type: "last_frame",
                                    });
                                }

                                if (frames.length == 0) {
                                    await KlingAI.kling4TextToVideo({
                                        prompt,
                                        duration:Number(workflow.duration ?? "3"),
                                        resolution: workflow.resolution,
                                    })
                                }
                                else {
                                    await KlingAI.kling4ImageToVideo({
                                        prompt,
                                        frames,
                                        duration:Number(workflow.duration ?? "3"),
                                        resolution: workflow.resolution,
                                    })
                                }


                            }}
                        >
                            Generate Video V4
                        </Button>

                        {/* Mode Selector */}
                        <WorkflowOptionSelect
                            project={project}
                            workflowName="generate_video_kling_v4"
                            optionName="resolution"
                            values={Object.values(KlingAI.options.kling4.resolution)}
                        />

                        {/* Duration Selector */}
                        <WorkflowOptionSelect
                            project={project}
                            workflowName="generate_video_kling_v4"
                            optionName="duration"
                            label="Duration:"
                            values={KlingAI.options.kling4.duration.map((val) => val.toString())}
                        />


                        {/* Loading Spinner */}
                        <LoadingSpinner isLoading={shot.is_submitting_video} asButton />

                    </>
                }
                content={
                    <>
                        <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
                        <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} />
                    </>
                }
            />





        </>
    );
});


