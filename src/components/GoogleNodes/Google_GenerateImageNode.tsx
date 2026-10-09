import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { GoogleAI } from "../../classes/GoogleAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import { Project } from "../../classes/Project";
import { TagsFolderContainer } from "../FolderTags/FolderTagsContainer";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { action_shotGenerateImage } from "../Scene/Shot/Actions/Basic/Action_ShotGenerateImage";
import { WorkflowImageModelSelect } from "../../classes/AiProviders/AI_Generic_Components";

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
                        onClick={async () => { action_shotGenerateImage(shot); }}
                    >
                        Generate Image
                    </button>

                    <WorkflowImageModelSelect workflowName="generate_shot_image"/>

                    <WorkflowOptionSelect
                        project={project}
                        workflowName="generate_shot_image"
                        optionName="aspect_ratio"
                        values={Object.values(GoogleAI.options.aspect_ratios)}
                        defaultValue={GoogleAI.options.aspect_ratios.r9x16}
                    />                    

                    <WorkflowOptionSelect
                        project={project}
                        workflowName="generate_shot_image"
                        optionName="resolution"
                        values={Object.values(GoogleAI.options.resolution)}
                        defaultValue={GoogleAI.options.resolution.none}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={shot.is_generating} asButton />
                </>
            }
            content={
                <>
                    <EditableJsonTextField localJson={shot.shotJson} field="prompt" fitHeight />
                    <TagsFolderContainer tags={shot.references} folders={[Project.getProject(), Project.getProject().artbook as LocalFolder]} />

                </>
            }
        />
    );
});


