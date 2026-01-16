import React, { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LocalImage } from "../classes/LocalImage";
import LoadingButton from "./LoadingButton";
import { GoogleAI } from "../classes/GoogleAI";
import SimpleSelect from "./Atomic/SimpleSelect";

interface ImageEditWindowProps {
  localImage: LocalImage;
  initialText?: string;
  onImageGenerated?: (result: any) => void;
  onClose?: () => void;
}

const ImageEditWindow: React.FC<ImageEditWindowProps> = ({
  localImage,
  initialText = "",
  onImageGenerated,
  onClose,
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

      const result = await GoogleAI.img2img(text || "", model, [
        { rawBase64: base64Obj.rawBase64, mime: base64Obj.mime, description: "" }
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
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Edit This Image:"
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
};

export default ImageEditWindow;
