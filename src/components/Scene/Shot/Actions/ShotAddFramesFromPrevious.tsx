import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import { CollapsibleContainerAccordion } from "../../../Atomic/CollapsibleContainer";
import { Button } from "react-bootstrap";
import { LocalVideo, type LocalVideoPreview } from "../../../../classes/fileSystem/LocalVideo";
import { blobToBase64 } from "../../../MediaComponents/MiniVideoEditor";
import type { MediaFolder } from "../../../../classes/MediaFolder";
import { LocalImage } from "../../../../classes/fileSystem/LocalImage";
import { useEffect, useRef, useState } from "react";
import type { LocalFolder } from "../../../../classes/fileSystem/LocalFolder";


interface Props {
    shot: Shot;
}


export const ShotAddFramesFromPrevious: React.FC<Props> = observer(({ shot }) => {

    const scene = shot.scene;
    const index = scene.get_shot_list_index(shot);
    const prevShot = shot.scene.shots_ordered[index - 1];
    const previewMedia = prevShot?.previewMedia;
    const previewVideo = previewMedia instanceof LocalVideo ? previewMedia : undefined;

    const videoRef = useRef<HTMLVideoElement>(null);
    const [previewInterval, setPreviewInterval] = useState(2);

    const captureFrame = async () => {
        const video = videoRef.current;
        if (!video || !previewVideo) return;
        try {
            const outFolder = shot.MediaFolder_results!;
            const image = await extractVideoFrame(
                video,
                outFolder,
                `${prevShot.name}_frame_${video.currentTime.toFixed(2)}.png`,
            );
            console.log("Saved frame:", image);
            //alert(`Frame saved: ${image.name}`);
            image.copyToClipboard();
            shot.references?.addTag(image);
        } catch (error) {
            console.error("Failed to extract frame:", error);
            alert(`Failed to extract frame: ${error}`);
        }
    };

    const savePreviewAsReference = async (frame: LocalVideoPreview) => {
        try {
            const outFolder = shot.MediaFolder_results!;

            const image = await savePreviewFrame(
                frame,
                outFolder,
                `${shot.name}_from_${prevShot.name}_frame_${frame.time.toFixed(2)}.png`,
            );

            console.log("Saved preview frame:", image);

            image.copyToClipboard();
            shot.references?.addTag(image);
        } catch (error) {
            console.error("Failed to save preview frame:", error);
            alert(`Failed to save frame: ${error}`);
        }
    };

    const saveAllPreviewsAsReferences = async () => {
        if (!previewVideo) return;

        try {
            const outFolder = shot.MediaFolder_results!;

            for (const frame of previewVideo.previewFrames) {
                const image = await savePreviewFrame(
                    frame,
                    outFolder,
                    `${prevShot.name}_time_${frame.time.toFixed(2)}.png`,
                );

                image.copyToClipboard();
                shot.references?.addTag(image);

                console.log("Saved preview as reference:", image);
            }
        } catch (error) {
            console.error("Failed to save previews:", error);
            alert(`Failed to save previews: ${error}`);
        }
    };

    useEffect(() => {
        if (!previewVideo) return;
        if (previewVideo.previewFrames.length === 0) {
            previewVideo.extractPreviews(previewInterval);
        }
    }, [previewVideo, previewVideo?.previewFrames.length]);


    return (
        <CollapsibleContainerAccordion label="Prev Shot Keyframes" defaultCollapsed={true}>
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Top: Video + Buttons */}
                <div
                    style={{
                        width: "100%",
                        height: "600px",
                        display: "flex",
                    }}
                >
                    {/* Video */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {previewVideo && (
                            <video
                                ref={videoRef}
                                src={previewVideo.urlObject!}
                                controls
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "600px",
                                    display: "block",
                                }}
                            />
                        )}
                    </div>

                    {/* Buttons */}
                    <div
                        style={{
                            width: "250px",
                            height: "600px",
                            flexShrink: 0,
                            borderLeft: "1px solid #444",
                            display: "flex",
                            flexDirection: "column",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                padding: "4px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                            }}
                        >
                            <Button
                                size="sm"
                                onClick={captureFrame}
                                disabled={!previewVideo}
                            >
                                Save Current Frame
                            </Button>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "4px",
                                    alignItems: "center",
                                }}
                            >
                                <Button
                                    size="sm"
                                    onClick={() => { previewVideo?.clearPreviews(); }}
                                    disabled={!previewVideo}
                                    style={{ flex: 1 }}
                                >
                                    Extract Previews
                                </Button>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.1"
                                    value={previewInterval}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        if (value > 0) {
                                            setPreviewInterval(value);
                                        }
                                    }}
                                    style={{
                                        width: "60px",
                                        height: "31px",
                                        padding: "2px 5px",
                                        boxSizing: "border-box",
                                    }}
                                    title="Frame extraction interval in seconds"
                                />
                            </div>

                            <Button
                                size="sm"
                                onClick={async () => {
                                    if (!previewVideo) return;
                                    const image = await savePreviewStrip(previewVideo, shot.MediaFolder_results!, `${prevShot.name}_PreviewStrip.png`);
                                    shot.references?.addTag(image);
                                }}
                                disabled={!previewVideo}
                            >
                                Save Preview Strip
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => {
                                    void saveAllPreviewsAsReferences();
                                }}
                                disabled={
                                    !previewVideo ||
                                    previewVideo.previewFrames.length === 0
                                }
                            >
                                Save All Previews as References
                            </Button>


                            <Button size="sm" variant="secondary" onClick={() => {
                                if (previewVideo) {
                                    shot.references?.addTag(previewVideo);
                                }
                            }} >
                                Add Prev Vod As REF
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Bottom: Full-width previews */}
                {/* Bottom: Full-width previews */}
                {previewVideo && previewVideo.previewFrames.length > 0 && (
                    <div
                        style={{
                            width: "100%",
                            borderTop: "1px solid #444",
                            boxSizing: "border-box",
                            overflowX: "auto",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                width: "max-content",
                                gap: "4px",
                            }}
                        >
                            {previewVideo.previewFrames.map((frame) => (
                                <div
                                    key={frame.time}
                                    style={{
                                        position: "relative",
                                        height: "200px",
                                        flexShrink: 0,
                                        cursor: "pointer",
                                        overflow: "hidden",
                                    }}
                                    onClick={() => {
                                        if (videoRef.current) {
                                            videoRef.current.currentTime = frame.time;
                                        }
                                    }}
                                    onDoubleClick={() => {
                                        void savePreviewAsReference(frame);
                                    }}
                                >
                                    <img
                                        src={frame.url}
                                        alt={`Frame at ${frame.time.toFixed(2)}s`}
                                        style={{
                                            height: "200px",
                                            width: "auto",
                                            display: "block",
                                        }}
                                    />

                                    {/* Small delete cross */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            previewVideo.removePreview(frame);
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: "4px",
                                            right: "4px",
                                            width: "20px",
                                            height: "20px",
                                            padding: 0,
                                            border: "none",
                                            borderRadius: "50%",
                                            background: "rgba(0, 0, 0, 0.7)",
                                            color: "white",
                                            fontSize: "14px",
                                            lineHeight: "20px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            zIndex: 10,
                                        }}
                                        title="Remove preview"
                                    >
                                        ×
                                    </button>

                                    {/* Timestamp overlay */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: "4px",
                                            left: "4px",
                                            padding: "2px 5px",
                                            background: "rgba(0, 0, 0, 0.75)",
                                            color: "#fff",
                                            fontSize: "12px",
                                            fontFamily: "monospace",
                                            lineHeight: "1.2",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {frame.time.toFixed(2)}s
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


            </div>
        </CollapsibleContainerAccordion>
    );
})



export async function extractVideoFrame(
    video: HTMLVideoElement,
    outputFolder: MediaFolder,
    filename: string,
): Promise<LocalImage> {

    if (!video.videoWidth || !video.videoHeight) {
        throw new Error("Video frame is not ready yet.");
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not create canvas context.");
    }

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
        throw new Error("Could not create image blob.");
    }

    const rawBase64 = await blobToBase64(blob);

    return await LocalImage.fromBase64(
        {
            rawBase64,
            mime: "image/png",
        },
        outputFolder,
        filename,
    );
}


export async function savePreviewFrame(
    frame: LocalVideoPreview,
    outputFolder: MediaFolder,
    filename: string,
): Promise<LocalImage> {
    const rawBase64 = await blobToBase64(frame.blob);

    return await LocalImage.fromBase64(
        {
            rawBase64,
            mime: "image/png",
        },
        outputFolder,
        filename,
    );
}

async function savePreviewStrip(
    localVideo: LocalVideo,
    outputFolder: LocalFolder,
    filename: string,
): Promise<LocalImage> {
    const blob = await localVideo.createPreviewStrip();

    const rawBase64 = await blobToBase64(blob);

    return await LocalImage.fromBase64(
        {
            rawBase64,
            mime: "image/jpeg",
        },
        outputFolder,
        filename,
    );
}