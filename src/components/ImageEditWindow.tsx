import React, { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LocalImage } from "../classes/LocalImage";
import LoadingButton from "./Atomic/LoadingButton";
import { GoogleAI } from "../classes/GoogleAI";
import SimpleSelect from "./Atomic/SimpleSelect";
import { observer } from "mobx-react-lite";
import EditableJsonTextField from "./EditableJsonTextField";
import TagsToggleList from "./TagsToggleList";

interface ImageEditWindowProps {
  localImage: LocalImage;
  initialText?: string;
  onImageGenerated?: (result: any) => void;
  onClose?: () => void;
  reference_images?: LocalImage[];
}

const ImageEditWindow: React.FC<ImageEditWindowProps> = observer(({
  localImage,
  initialText = "Redraw the source_image using reference images ref1,ref2,ref3.",
  onImageGenerated,
  onClose,
  reference_images = [],
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState(initialText);
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
      const prompt = (localImage.shot) ? localImage.shot.shotJson?.getField("image_edit_prompt/" + localImage.name + "/prompt") : { text };

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

      if (onImageGenerated) onImageGenerated(result);
    } catch (err) {
      console.error("GenerateImage failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="border d-flex flex-column" style={{ height: "700px" }}>
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
            <div className="d-flex justify-content-end mb-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex-grow-1 d-flex flex-column">

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

              {localImage.shot ?
                (
                  <>
                    <>Prompt : </>
                    <EditableJsonTextField localJson={localImage.shot.shotJson} field={"image_edit_prompt/" + localImage.name + "/prompt"} fitHeight />
                  </>
                )
                :
                (<textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Redraw the source_image using reference images ref1,ref2,ref3."
                  style={{
                    flexGrow: 1,
                    resize: "none",
                    padding: "8px",
                    fontSize: "14px",
                  }}
                />)
              }

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

            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
});

export default ImageEditWindow;
