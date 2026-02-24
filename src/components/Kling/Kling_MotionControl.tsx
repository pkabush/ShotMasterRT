import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import { KlingAI } from "../../classes/KlingAI";
import { Shot } from "../../classes/Shot";
import MediaGalleryVideo from "../MediaComponents/MediaGalleryVideo";
import EditableJsonTextField from "../EditableJsonTextField";
import MediaGalleryPreview from "../MediaComponents/MediaGallerPreview";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";

interface Kling_MotionControlProps {
  shot: Shot;
}

export const Kling_MotionControl: React.FC<Kling_MotionControlProps> = observer(({ shot }) => {
  const project = shot.scene.project;

  return (
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          {/* Generate Motion Control Video */}
          <button
            className="btn btn-sm btn-outline-success"
            onClick={async () => {
              shot.GenerateVideo_KlingMotionControl();
            }}
          >
            Gen Motion Control Video
          </button>

          {/* Character Orientation Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="kling_motion_control"
            optionName="character_orientation"
            label="Orient:"
            values={Object.values(KlingAI.options.motion_control.character_orientation)}
          />

          {/* Mode Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="kling_motion_control"
            optionName="mode"
            label="mode:"
            values={Object.values(KlingAI.options.motion_control.mode)}
          />

          {/* Sound Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="kling_motion_control"
            optionName="keep_original_sound"
            label="Sound:"
            values={Object.values(KlingAI.options.motion_control.keep_original_sound)}
          />

          {/* Loading Spinner */}
          <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
        </>
      }
      content={
        <>
          <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />

          <MediaGalleryPreview mediaItem={shot.srcImage as LocalMedia} height={400} />

        {/* Reference Video Preview */}
          {shot.kling_motion_video && (
            <MediaGalleryVideo
              localVideo={shot.kling_motion_video}
              height={400}
            />
          )}

          <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} />
          <MediaFolderGallery mediaFolder={shot.MediaFolder_refVideo} label="Motion Video" itemHeight={300} />


        </>
      }
    />
  );
});
