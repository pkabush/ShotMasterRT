import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { KlingAI } from "../../classes/KlingAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import MediaGalleryPreview from "../MediaGallerPreview";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/interfaces/LocalMedia";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";

interface Kling_GenerateVideoProps {
  shot: Shot;
}

export const Kling_GenerateVideo: React.FC<Kling_GenerateVideoProps> = observer(({ shot }) => {
  const project = shot.scene.project;

  return (
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          {/* Generate Video Button */}
          <button
            className="btn btn-sm btn-outline-success"
            onClick={async () => {
              shot.GenerateVideo();
            }}
          >
            Generate Video
          </button>

          {/* Model Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="generate_video_kling"
            optionName="model"
            values={Object.values(KlingAI.options.img2video.model)}
          />

          {/* Mode Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="generate_video_kling"
            optionName="mode"
            label="mode:"
            values={Object.values(KlingAI.options.img2video.mode)}
          />

          {/* Duration Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="generate_video_kling"
            optionName="duration"
            label="Duration:"
            values={Object.values(KlingAI.options.img2video.duration)}
          />

          {/* Loading Spinner */}
          <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
        </>
      }
      content={
        <>
          <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
          <MediaGalleryPreview mediaItem={shot.srcImage as LocalMedia} height={400} />
          <MediaGalleryPreview
            mediaItem={shot.MediaFolder_results?.getNamedMedia("end_frame") as LocalMedia}
            height={400}
          />

          <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} />
        </>
      }
    />
  );
});
