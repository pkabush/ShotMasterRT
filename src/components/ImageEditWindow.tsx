import React, { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LocalImage } from "../classes/fileSystem/LocalImage";
import LoadingButton from "./Atomic/LoadingButton";
import { GoogleAI } from "../classes/GoogleAI";
import { observer } from "mobx-react-lite";
import EditableJsonTextField, { EditableJsonToggleField } from "./EditableJsonTextField";
import TabsContainer from "./TabsContainer";
import { MediaFolder } from "../classes/MediaFolder";
import type { LocalFolder } from "../classes/fileSystem/LocalFolder";
import MediaGalleryPreview from "./MediaComponents/MediaGallerPreview";
import BottomCenterLabel from "./Atomic/MediaElements/BottomCenterLabel";
import RefImagesPreview from "./MediaComponents/RefImagesPreview";
import { WorkflowOptionSelect, WorkflowTextField } from "./WorkflowOptionSelect";
import { useProject } from "../contexts/ProjectContext";
import { TagsFolderContainer } from "./FolderTags/FolderTagsContainer";
import { Project } from "../classes/Project";
import { Button, Stack } from "react-bootstrap";
import FullPageOverlay from "./Containers/FullPageOverlay";
import DrawingCanvas from "./DrawingCanvas/DrawingCanvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrush } from "@fortawesome/free-solid-svg-icons";
import { AI } from "../classes/AiProviders/AI_Generic";
import { WorkflowImageModelSelect } from "../classes/AiProviders/AI_Generic_Components";
import { flipImageBlobHorizontally } from "./Scene/Shot/Actions/Previs/ImageSplitUtils";
import SimpleSelect from "./Atomic/SimpleSelect";

interface ImageEditWindowProps {
  localImage: LocalImage;
  onClose?: () => void;
  reference_images?: LocalImage[];
}

const MAX_PENDING_GENERATIONS = 5;

const ImageEditWindow: React.FC<ImageEditWindowProps> = observer(({
  localImage,
  onClose,
  reference_images = [],
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [pendingGenerations, setPendingGenerations] = useState(0);
  const generating = pendingGenerations > 0;
  const { project } = useProject();

  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    let mounted = true;
    localImage.getUrlObject().then((objUrl) => {
      if (mounted) setUrl(objUrl);
    });
    return () => {
      mounted = false;
    };
  }, [localImage]);

  const do_stylize = localImage.mediaJson?.getField("use_stylize_prompt") ?? false;

  const handleGenerate = async () => {
    if (pendingGenerations >= MAX_PENDING_GENERATIONS) {
      console.log("MAX GENERATIONS REACHED! wait for others to finish, or reopen edit window");
      return;
    }
    setPendingGenerations(prev => prev + 1);

    try {

      const prompt = do_stylize ?
        `
        ${project?.projinfo?.getField("workflows/stylize_image_google/prompt") ?? ""}

        ${localImage.mediaJson?.getField("image_edit_prompt")}
        `
        :
        localImage.mediaJson?.getField("image_edit_prompt");
      const ref_images = localImage.references?.active_images ?? [];
      let genImage: LocalImage | null = null;

      const images = [localImage, ...ref_images]

      const model = project?.workflows?.edit_image?.model;
      const aspect_ratio = project?.workflows?.edit_image?.aspect_ratio ?? GoogleAI.options.aspect_ratios.r9x16;
      const resolution = project?.workflows?.edit_image?.resolution ?? GoogleAI.options.resolution.none;

      // Add Images and resolution
      const res = await AI.GenerateImage({
        prompt,
        model,
        aspect_ratio,
        resolution,
        images
      })
      genImage = await GoogleAI.saveResultImage(res, localImage.parentFolder as LocalFolder);

      console.log("GENERATED IMAGE", genImage);
      if (genImage) {
        genImage?.mediaJson?.updateField("geninfo", {
          workflow: "image_edit",
          prompt: prompt,
          model: model,
          refs: reference_images.map(img => img.path),
          art_refs: localImage.references?.get_active_tags ?? [],
          source: localImage.path,
        })

        const storyboard_index = localImage.mediaJson?.getField("storyboard_index");
        if (!(storyboard_index === null)) {
          genImage?.mediaJson?.updateField("storyboard_index", storyboard_index);
        }
      }

    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      setPendingGenerations(prev => Math.max(0, prev - 1));
    }
  };



  return (<>
    <div className="border d-flex flex-column position-relative"
    //style={{ height: "700px" }}
    >
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
                    <Stack direction="horizontal" gap={3}>
                      <Button onClick={() => { setShowCanvas(true) }} variant="warning" size="sm"> DRAW
                        <FontAwesomeIcon icon={faBrush} />
                      </Button>
                    </Stack>

                    <RefImagesPreview images={reference_images} />
                    <TagsFolderContainer tags={localImage.references} folders={[
                      Project.getProject(),
                      Project.getProject().artbook as LocalFolder,
                      localImage.parentFolder! as LocalFolder,
                    ]} />


                    {/**  Stylize */}
                    <EditableJsonToggleField localJson={localImage.mediaJson} field="use_stylize_prompt" default_val={do_stylize} />
                    {do_stylize && <WorkflowTextField workflowName={"stylize_image_google"} optionName={"prompt"} />}


                    <EditableJsonTextField localJson={localImage.mediaJson} field={"image_edit_prompt"} fitHeight />



                    {/** Generate Settings */}
                    <div
                      className={`w-100`}
                      style={{ display: 'inline-block' }}
                    >

                      <LoadingButton
                        className="btn-outline-success"
                        onClick={handleGenerate}
                        label={generating ? `Generating : ${pendingGenerations} left` : "Generate"}
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

                      {/** Select Aspect Ratio */}
                      <WorkflowOptionSelect
                        project={project!}
                        workflowName="edit_image"
                        optionName="resolution"
                        values={Object.values(GoogleAI.options.resolution)}
                        defaultValue={GoogleAI.options.resolution.none}
                        label="Resolution:"
                      />

                      {/** Select Model */}
                      <WorkflowImageModelSelect workflowName="edit_image" />


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
                      {JSON.stringify(localImage.mediaJson?.data, null, 2)}
                    </pre>
                  </div>

                </>,

                /*
              CensorImage: <>
                <SettingsButton buttons={
                  <>
                    <Button size="sm" variant="outline-success"
                      onClick={async () => {
                        const res_image = await WF_Image_censor.run(localImage);
                        console.log("Censored Image", res_image);
                      }}
                    > Censor Image </Button>

                    <WorkflowImageModelSelect workflowName={WF_Image_censor.name} />
                  </>
                }
                  content={
                    <>
                      <WorkflowTextField workflowName={WF_Image_censor.name} optionName={"prompt"} />
                    </>
                  }
                />
              </>,
              */
                Image_Description: <>
                  <Button size="sm" variant="outline-warning">Rename</Button>
                  {localImage.name}
                  <br/>
                  <SimpleSelect
                    value= {localImage.mediaJson?.getField("storyboard_index") ?? "none" }
                    options={["none", "0", "1", "2", "3","4","5","6","7","8","9","10","11","12","13","14","15"]}
                    label="Storyboard_Index"
                    onChange={(val) => { 
                      if( val === "none" ){
                        localImage.mediaJson?.updateField("storyboard_index",undefined);
                      }
                      else {
                        localImage.mediaJson?.updateField("storyboard_index",Number(val));
                      }
                    }}
                  />

                  <EditableJsonTextField localJson={localImage.mediaJson} field="description" />
                </>,
                Utils: <ImageUtils localImage={localImage} />
              }}
            />
          </div>
        </Panel>
      </Group>
    </div >

    <FullPageOverlay show={showCanvas}>
      <DrawingCanvas image={localImage} onClose={() => { setShowCanvas(false) }} />
    </FullPageOverlay>

  </>);

});


interface ImageUtilsProps {
  localImage: LocalImage;
}

const ImageUtils: React.FC<ImageUtilsProps> = observer(({ localImage }) => {


  return <>
    <Button
      size="sm"
      variant="outline-warning"
      onClick={async () => {
        const blob = await localImage.toBlob()
        const flipped_blob = await flipImageBlobHorizontally(blob);
        const image = await LocalImage.fromBlob(flipped_blob, localImage.parentFolder!, localImage.name);
        if (image.parentFolder instanceof MediaFolder) image.parentFolder.setSelectedMedia(image);
      }}
    >
      Flip Horisontal
    </Button>


  </>
});


export default ImageEditWindow;
