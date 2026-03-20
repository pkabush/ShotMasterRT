import React, { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LocalImage } from "../classes/fileSystem/LocalImage";
import LoadingButton from "./Atomic/LoadingButton";
import { GoogleAI } from "../classes/GoogleAI";
import { observer } from "mobx-react-lite";
import EditableJsonTextField from "./EditableJsonTextField";
import TagsToggleList from "./TagsToggleList";
import TabsContainer from "./TabsContainer";
import type { MediaFolder } from "../classes/MediaFolder";
import type { LocalFolder } from "../classes/fileSystem/LocalFolder";
import MediaGalleryPreview from "./MediaComponents/MediaGallerPreview";
import BottomCenterLabel from "./Atomic/MediaElements/BottomCenterLabel";
import RefImagesPreview from "./MediaComponents/RefImagesPreview";
import { ChatGPT } from "../classes/ChatGPT";
import { WorkflowOptionSelect } from "./WorkflowOptionSelect";
import { useProject } from "../contexts/ProjectContext";




interface ImageEditWindowProps {
  localImage: LocalImage;
  onClose?: () => void;
  reference_images?: LocalImage[];
}

const ImageEditWindow: React.FC<ImageEditWindowProps> = observer(({
  localImage,
  onClose,
  reference_images = [],
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [useShotTags, setUseShotTags] = useState<boolean>(!!localImage.shot);

  const { project } = useProject();

  useEffect(() => {
    let mounted = true;
    localImage.getUrlObject().then((objUrl) => {
      if (mounted) setUrl(objUrl);
    });
    return () => {
      mounted = false;
    };
  }, [localImage]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const base64Obj = await localImage.getBase64(); // uses cached Base64 if available
      const refs = await Promise.all(reference_images.map(img => img.getBase64()));
      const prompt = localImage.mediaJson?.getField("image_edit_prompt");

      const tagImages =
        useShotTags && localImage.shot
          ? await localImage.shot.getImageTags()
          : [];

      let genImage: LocalImage | null = null;

      const images = [
        {
          rawBase64: base64Obj.rawBase64,
          mime: base64Obj.mime,
          description: "source_image",
        },
        ...refs.map((r, index) => ({
          rawBase64: r.rawBase64,
          mime: r.mime,
          description: `ref${index + 1}`,
        })),
        ...tagImages,
      ]

      const model = project!.workflows.edit_image.model || GoogleAI.options.img_models.flash_image
      const aspectRatio = project!.workflows.edit_image.aspect_ratio || GoogleAI.options.aspect_ratios.r9x16

      // Check IF Google
      if (Object.values(GoogleAI.options.img_models).includes(model)) {
        const result = await GoogleAI.img2img(prompt || "", model, images, aspectRatio);
        console.log("Image generated:", result);
        genImage = await GoogleAI.saveResultImage(result, localImage.parentFolder as LocalFolder);
      }

      if (Object.values(ChatGPT.options.models).includes(model)) {
        console.log("GPT Model", model);
        const result = await ChatGPT.img2img(prompt || "", model, images);
        console.log("Image generated:", result);
        genImage = await GoogleAI.saveResultImage(result, localImage.parentFolder as LocalFolder);
      }

      console.log("GENERATED IMAGE", genImage);
      if (genImage) {
        genImage?.mediaJson?.updateField("geninfo", {
          workflow: "image_edit",
          prompt: prompt,
          model: model,
          refs: reference_images.map(img => img.path),
          art_refs: useShotTags && localImage.shot ? localImage.shot.getFilteredTags().map(tag => tag.path) : [],
          source: localImage.path,
        })
      }


    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (<>
    <div className="border d-flex flex-column position-relative" style={{ height: "700px" }}>
      {/** CLOSE BUTTON */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",  // remove from normal flow
            top: "8px",            // distance from top
            right: "8px",          // distance from right
            cursor: "pointer",
            background: "transparent",
            border: "none",
            fontSize: "1.2rem"
          }}
        >
          ✕
        </button>
      )}

      <Group orientation="horizontal" style={{ height: "100%" }}>
        {/* Left panel — image */}
        <Panel defaultSize={500} minSize={10}>
          <div
            className="d-flex align-items-center justify-content-center overflow-hidden position-relative"
            style={{ height: "100%" }}
          >
            {url ? (
              <>
                <img
                  src={url}
                  alt="Preview"
                  className="img-fluid"
                  style={{
                    objectFit: "contain",
                    maxHeight: "100%",
                    maxWidth: "100%",
                  }}
                />
                <BottomCenterLabel label="Source Image" />
              </>
            ) : (
              <div>Loading image…</div>
            )}
          </div>
        </Panel>

        {/* Split / drag handle */}
        <Separator
          style={{
            cursor: "ew-resize",
            backgroundColor: "#8f8f8fff",
            width: "10px",
          }}
        />

        {/* Right panel — settings */}
        <Panel minSize={10}>
          <div className="d-flex flex-column h-100 p-3" style={{ height: "100%" }}>
            <TabsContainer
              tabs={{
                ImageEdit:
                  < div className="flex-grow-1 d-flex flex-column">

                    <RefImagesPreview images={reference_images} />

                    {localImage.shot && (
                      <label className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={useShotTags}
                          onChange={(e) => setUseShotTags(e.target.checked)}
                        />
                        Use shot tags
                      </label>
                    )}

                    {localImage.shot && useShotTags && (<TagsToggleList shot={localImage.shot} />)}

                    <>
                      <>Prompt : </>
                      <EditableJsonTextField localJson={localImage.mediaJson} field={"image_edit_prompt"} fitHeight />
                    </>


                    {/** Generate Settings */}
                    <div
                      className={`w-100`}
                      style={{ display: 'inline-block' }}
                    >

                      <LoadingButton
                        onClick={handleGenerate}
                        label="Generate"
                        is_loading={generating}
                      />

                      {/** Select Aspect Ratio */}
                      <WorkflowOptionSelect
                        project={project!}
                        workflowName="edit_image"
                        optionName="aspect_ratio"
                        values={Object.values(GoogleAI.options.aspect_ratios)}
                        defaultValue={GoogleAI.options.aspect_ratios.r9x16}
                        label="Aspect Ratio:"
                      />

                      {/** Select Model */}
                      <WorkflowOptionSelect
                        project={project!}
                        workflowName="edit_image"
                        optionName="model"
                        values={[
                          ...Object.values(ChatGPT.options.models),
                          ...Object.values(GoogleAI.options.img_models)
                        ]}
                        defaultValue={GoogleAI.options.img_models.flash_image}
                        label="Model:"
                      />

                    </div>


                  </div>,
                GenerateInfo: <>
                  {/* Source preview */}
                  {localImage.sourceImage && (
                    <>
                      <MediaGalleryPreview
                        mediaItem={localImage.sourceImage}
                        height={150}
                        onSelectMedia={() => {
                          const mf = localImage.sourceImage?.parentFolder as MediaFolder;
                          mf.setSelectedMedia(localImage.sourceImage);
                        }}
                      >
                        <BottomCenterLabel label="SOURCE" />
                      </MediaGalleryPreview>
                    </>
                  )}

                  {/* Generated media previews */}
                  {localImage.generatedMedia?.length > 0 && (
                    <>
                      {localImage.generatedMedia.map((media) => (
                        <MediaGalleryPreview
                          height={150}
                          key={media.path}   // or media.id if you have one
                          mediaItem={media}
                          onSelectMedia={() => {
                            const mf = media.parentFolder as MediaFolder;
                            mf.setSelectedMedia(media);
                          }}
                        >
                          <BottomCenterLabel label="Child" />
                        </MediaGalleryPreview>
                      ))}
                    </>
                  )}

                  <div>
                    <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                      {JSON.stringify(localImage.mediaJson?.data.geninfo, null, 2)}
                    </pre>
                  </div>

                </>,
              }}
            />

          </div>
        </Panel>
      </Group>
    </div >
  </>);



}

);

export default ImageEditWindow;
