import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { img_models } from "../../classes/GoogleAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import MediaGalleryPreview from "../MediaComponents/MediaGallerPreview";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/interfaces/LocalMedia";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import TagsToggleList from "../TagsToggleList";


interface Google_StylizeImageNodeProps {
    shot: Shot;
}

export const Google_StylizeImageNode: React.FC<Google_StylizeImageNodeProps> = observer(({ shot }) => {
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
                            //console.log("Stylize Image")
                            shot.StylizeImage();
                        }}
                    >
                        Stylize Image
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        project={project}
                        workflowName="stylize_image_google"
                        optionName="model"
                        values={img_models}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={shot.is_generating} asButton />
                </>
            }
            content={
                <>
                    {/* Preview original input image */}
                    <MediaGalleryPreview mediaItem={shot.unreal_frame as LocalMedia} height={300} label="REFERENCE" />

                    <EditableJsonTextField localJson={project.projinfo} field="workflows/stylize_image_google/prompt" fitHeight />

                    <EditableJsonTextField localJson={shot.shotJson} field="stylize_prompt" fitHeight />



                    {/* Media folder gallery for results */}
                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="pick reference Frame" itemHeight={300} />
                    <TagsToggleList shot={shot} />
                </>
            }
        />
    );
});
