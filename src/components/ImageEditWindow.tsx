import React, { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LocalImage } from "../classes/LocalImage";
import LoadingButton from "./Atomic/LoadingButton";
import { GoogleAI } from "../classes/GoogleAI";
import SimpleSelect from "./Atomic/SimpleSelect";
import { observer } from "mobx-react-lite";
import EditableJsonTextField from "./EditableJsonTextField";
import TagsToggleList from "./TagsToggleList";
import TabsContainer from "./TabsContainer";
import SimpleButton from "./Atomic/SimpleButton";




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
  const [model, setModel] = useState<string>(GoogleAI.options.img_models.flash_image);
  const [useShotTags, setUseShotTags] = useState<boolean>(!!localImage.shot);

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

      const result = await GoogleAI.img2img(prompt || "", model, [
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
      ]);

      console.log("Image generated:", result);
      const genImage: LocalImage | null = await GoogleAI.saveResultImage(result, localImage.parent as FileSystemDirectoryHandle);
      if (genImage) {
        const loadedLocalImage = await localImage.mediaFolder?.loadFile(genImage?.handle);

        loadedLocalImage?.mediaJson?.updateField("geninfo", {
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

                {/* Bottom-center text overlay */}
                <div
                  className="
                    position-absolute 
                    bottom-0
                    start-50
                    translate-middle-x
                    mb-2
                    px-2
                    py-1
                    text-white
                    bg-dark
                    bg-opacity-50
                    rounded
                    small
                    text-nowrap
                  "
                  style={{ pointerEvents: "none" }}
                >
                  (Source Image)
                </div>
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
                    {/**
              <MediaFolderGallery mediaFolder={localImage.shot?.MediaFolder_results || null } showEditWindow={false} itemHeight={200} label="Reference Images"/>              
              */}

                    {/** REFERENCE IMAGES */}
                    {reference_images.length > 0 && (
                      <div className="d-flex gap-2 mb-2 flex-wrap">
                        {reference_images.map((img, i) => {
                          if (!img.urlObject) {
                            img.getUrlObject();
                            return null;
                          }

                          return (
                            <div
                              key={i}
                              style={{
                                position: "relative",
                                width: 100,
                                height: 100,
                              }}
                            >
                              <img
                                src={img.urlObject}
                                alt={`ref-${i}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: 4,
                                  border: "1px solid #444",
                                  display: "block",
                                }}
                              />

                              {/* Bottom-center overlay text */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 4,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  background: "rgba(0,0,0,0.6)",
                                  color: "#fff",
                                  fontSize: 12,
                                  padding: "2px 6px",
                                  borderRadius: 3,
                                  pointerEvents: "none",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ref{i + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}


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


                    <SimpleSelect
                      value={model}
                      options={Object.values(GoogleAI.options.img_models)}
                      label={"Model:"}
                      onChange={(val: string) => {
                        setModel(val);
                      }}
                    />
                    <LoadingButton
                      onClick={handleGenerate}
                      label="Generate"
                      is_loading={generating}
                    />

                  </div>,
                GenerateInfo: <>


                  <div>
                    <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                      {JSON.stringify(localImage.mediaJson?.data.geninfo, null, 2)}
                    </pre>
                  </div>

                  <SimpleButton onClick={ () => {
                    const source = localImage.mediaJson?.getField("geninfo/source")
                    
                  }}/>

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
