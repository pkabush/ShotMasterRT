import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { GoogleAI } from "../../classes/GoogleAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import MediaGalleryPreview from "../MediaComponents/MediaGallerPreview";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import BottomCenterLabel from "../Atomic/MediaElements/BottomCenterLabel";
import { TagsFolderContainer } from "../FolderTags/FolderTagsVide";
import { Project } from "../../classes/Project";


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
                        onClick={async () => { shot.StylizeImage(); }}
                    >
                        Stylize Image
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        project={project}
                        workflowName="stylize_image_google"
                        optionName="model"
                        values={Object.values(GoogleAI.options.img_models)}
                    />

                    <WorkflowOptionSelect
                        project={project}
                        workflowName="stylize_image_google"
                        optionName="aspect_ratio"
                        values={Object.values(GoogleAI.options.aspect_ratios)}
                        defaultValue={GoogleAI.options.aspect_ratios.r9x16}
                    />


                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={shot.is_generating} asButton />
                </>
            }
            content={
                <>
                    {/* Preview original input image */}
                    <MediaGalleryPreview mediaItem={shot.unreal_frame as LocalMedia} height={300}>
                        <BottomCenterLabel label="REFERENCE" />
                    </MediaGalleryPreview>

                    <EditableJsonTextField localJson={project.projinfo} field="workflows/stylize_image_google/prompt" fitHeight />

                    <EditableJsonTextField localJson={shot.shotJson} field="stylize_prompt" fitHeight />



                    {/* Media folder gallery for results */}
                    <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="pick reference Frame" itemHeight={300} />

                    <TagsFolderContainer tags={shot.references} local_folder={Project.getProject().artbook} />
                </>
            }
        />
    );
});
