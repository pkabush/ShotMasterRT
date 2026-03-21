import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { GoogleAI } from "../../classes/GoogleAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import { Project } from "../../classes/Project";
import { TagsFolderContainer } from "../FolderTags/FolderTagsVide";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";

interface Google_GenerateImageNodeProps {
    shot: Shot;
}

export const Google_GenerateImageNode: React.FC<Google_GenerateImageNodeProps> = observer(({ shot }) => {
    const project = shot.scene.project;

    return (
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            console.log("Generate Image")
                            shot.GenerateImage();
                        }}
                    >
                        Generate Image
                    </button>

                    {/* Model Selector */}

                    <WorkflowOptionSelect
                        project={project}
                        workflowName="generate_shot_image"
                        optionName="model"
                        values={Object.values(GoogleAI.options.img_models)}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={shot.is_generating} asButton />
                </>
            }
            content={
                <>

                    {/**
                        <EditableJsonTextField localJson={project.projinfo} field="workflows/stylize_image_google/prompt" fitHeight />
                    */}

                    <EditableJsonTextField localJson={shot.shotJson} field="prompt" fitHeight />


                    {/* Media folder gallery for results */}
                    
                    <TagsFolderContainer tags={shot.references} folders={[Project.getProject(),Project.getProject().artbook as LocalFolder]} />

                </>
            }
        />
    );
});
