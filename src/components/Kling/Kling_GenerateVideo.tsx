import React from "react";
import { observer } from "mobx-react-lite";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import { KlingAI } from "../../classes/KlingAI";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import MediaGalleryPreview from "../MediaComponents/MediaGallerPreview";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import type { Shot } from "../../classes/Shot";
import EditableJsonTextField from "../EditableJsonTextField";
import { Google_GenerateKlingPrompt } from "../GoogleNodes/Google_GenerateKlingPrompt";
import { CollapsibleContainerAccordion } from "../Atomic/CollapsibleContainer";
import { Button, Stack } from "react-bootstrap";
import { AI, AllTextModels } from "../../classes/AI_provider";
import BottomCenterLabel from "../Atomic/MediaElements/BottomCenterLabel";
import AddOutline from "../Atomic/MediaElements/AddOutline";

interface Kling_GenerateVideoProps {
  shot: Shot;
}

export const Kling_GenerateVideo: React.FC<Kling_GenerateVideoProps> = observer(({ shot }) => {
  const project = shot.scene.project;

  const kling_docs = "docs/kling/video_api"

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

          {/* Duration Selector */}
          <WorkflowOptionSelect
            project={project}
            workflowName="generate_video_kling"
            optionName="sound"
            label="Sound:"
            values={Object.values(KlingAI.options.img2video.sound)}
          />

          {/* Loading Spinner */}
          <LoadingSpinner isLoading={shot.is_submitting_video} asButton />



          {/* Prompt Generation */}
          <Button size="sm" variant="outline-success" onClick={async () => { generate_shot_kling_video_prompt(shot) }}> Gen Prompt </Button>
          <WorkflowOptionSelect
            workflowName={"Generate_KlingVideoPrompt"}
            optionName={"model"}
            values={AllTextModels}
          />

        </>
      }
      content={
        <>
          <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
          <EditableJsonTextField localJson={shot.shotJson} field="generated_video_prompt" fitHeight />
          {false && <Google_GenerateKlingPrompt shot={shot} />}

          <ShotStartEndFramePreview shot={shot} />

          <MediaFolderGallery mediaFolder={shot.MediaFolder_results} label="Source Image" itemHeight={300} />

          <CollapsibleContainerAccordion label="Gen Prompt Options" defaultCollapsed={true}>
            <EditableJsonTextField localJson={shot.scene.project.projinfo} field={kling_docs} fitHeight collapsed={true} />
            <WorkflowTextField workflowName={"Generate_KlingVideoPrompt"} optionName={"prompt"} />
          </CollapsibleContainerAccordion>
        </>
      }
    />
  );
});


async function generate_shot_kling_video_prompt(shot: Shot) {

  console.log("Generate Shot Prompt");
  const project = shot.scene.project;
  const wf_name = "Generate_KlingVideoPrompt"
  const kling_docs = "docs/kling/video_api"

  const workflow = project.workflows[wf_name] ?? ""

  let source_prompt = shot.shotJson?.getField("video_prompt")

  const prompt = `
      Kling Prompting Guide:
      ${project.projinfo?.getField(kling_docs)}

      ${workflow.prompt} 
      
      ${source_prompt}
  `

  const images = []

  if (shot.srcImage) {
    const base64Obj = await shot.srcImage.getBase64();
    images.push({
      rawBase64: base64Obj.rawBase64,
      mime: base64Obj.mime,
      description: "first_frame",
    });
  }

  if (shot.end_frame) {
    const base64Obj = await shot.end_frame.getBase64();
    images.push({
      rawBase64: base64Obj.rawBase64,
      mime: base64Obj.mime,
      description: "end_frame",
    });
  }

  console.log(images);
  const res = await AI.GenerateText({
    prompt: prompt,
    model: workflow.model!,
    images: images,
  })

  if (res) {
    shot.shotJson!.updateField("generated_video_prompt", res);
  }
}





interface ShotStartEndFramePreviewProps {
  shot: Shot;
}

export const ShotStartEndFramePreview = observer(
  ({ shot }: ShotStartEndFramePreviewProps) => {
    const EmptyFrame = ({ label }: { label: string }) => (
      <div
        style={{
          width: 150,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #a9a851",
        }}
      >
        <span>{label}</span>
      </div>
    );

    return (
      <Stack direction="horizontal" gap={3}>
        {shot.srcImage ? (
          <MediaGalleryPreview
            mediaItem={shot.srcImage as LocalMedia}
            height={200}
          >
            <BottomCenterLabel label="start frame" />
            <AddOutline color="#29c024e2" showOutline />
          </MediaGalleryPreview>
        ) : shot.MediaFolder_results?.media[0] ? (
          <MediaGalleryPreview
            mediaItem={shot.MediaFolder_results.media[0] as LocalMedia}
            height={200}
          >
            <BottomCenterLabel label="start - preview" />
            <AddOutline color="#ffd025e2" showOutline />
          </MediaGalleryPreview>
        ) : (
          <EmptyFrame label="No Start Frame" />
        )}

        {shot.end_frame ? (
          <MediaGalleryPreview
            mediaItem={shot.end_frame as LocalMedia}
            height={200}
          >
            <BottomCenterLabel label="end frame" />
            <AddOutline color="#2455c0e2" showOutline />
          </MediaGalleryPreview>
        ) : (
          <EmptyFrame label="No End Frame" />
        )}
      </Stack>
    );
  }
);