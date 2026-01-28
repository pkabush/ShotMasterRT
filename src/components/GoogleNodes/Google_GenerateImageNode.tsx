import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { img_models } from "../../classes/GoogleAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import TagsToggleList from "../TagsToggleList";


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
                        values={img_models}
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
                    <TagsToggleList shot={shot} />
                </>
            }
        />
    );
});
