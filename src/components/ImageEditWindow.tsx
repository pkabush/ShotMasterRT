import React, { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LocalImage } from "../classes/LocalImage";
import LoadingButton from "./Atomic/LoadingButton";
import { GoogleAI } from "../classes/GoogleAI";
import SimpleSelect from "./Atomic/SimpleSelect";
import { observer } from "mobx-react-lite";

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

      const result = await GoogleAI.img2img(text || "", model, [
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
        <Panel defaultSize={500} minSize={10} >
          <div
            className="d-flex align-items-center justify-content-center overflow-hidden"
            style={{ height: "100%" }}
          >
            {url ? (
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

              {/**REFERENCE IMAGES */}
              {reference_images.length > 0 && (
                <div className="d-flex gap-2 mb-2 flex-wrap">
                  {reference_images.map((img, i) => {
                    if (!img.urlObject) {
                      img.getUrlObject();
                      return null;
                    }

                    return (
                      <img
                        key={i}
                        src={img.urlObject}
                        alt={`ref-${i}`}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 4,
                          border: "1px solid #444",
                        }}
                      />
                    );
                  })}
                </div>
              )}

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Redraw the source_image using reference images ref1,ref2,ref3."
                style={{
                  flexGrow: 1,
                  resize: "none",
                  padding: "8px",
                  fontSize: "14px",
                }}
              />
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
