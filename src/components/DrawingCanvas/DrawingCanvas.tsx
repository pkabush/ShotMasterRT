import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { LocalImage } from "../../classes/fileSystem/LocalImage";
import { Button, ButtonGroup, Form } from "react-bootstrap";
import type { MediaFolder } from "../../classes/MediaFolder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

type LineType = {
    points: number[];
    color: string;
    strokeWidth: number;
};
type Props = {
    image?: LocalImage;
    onClose?: () => void;
};

const DrawingCanvas: React.FC<Props> = ({ image, onClose = () => { } }) => {
    const [lines, setLines] = useState<LineType[]>([]);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [imgSize, setImgSize] = useState<{ width: number; height: number; } | null>(null);

    const isDrawing = useRef(false);
    const stageRef = useRef<Konva.Stage | null>(null);

    const [color, setColor] = useState("#ff0000");
    const [strokeWidth, setStrokeWidth] = useState(5);

    // Load LocalImage → HTMLImageElement + natural size
    useEffect(() => {
        if (!image) return;

        const loadImage = async () => {
            const { rawBase64, mime } = await image.getBase64();

            const img = new window.Image();
            img.src = `data:${mime};base64,${rawBase64}`;

            img.onload = () => {
                setBgImage(img);

                // ✅ preserve original image size (NO stretching)
                setImgSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
        };

        loadImage();
    }, [image]);

    // Export full canvas (image + drawings)
    const exportToPNG = async () => {
        if (!stageRef.current) return;

        const uri = stageRef.current.toDataURL({
            mimeType: "image/png",
            pixelRatio: 1,
        });

        /*
        const link = document.createElement("a");
        link.download = "drawing.png";
        link.href = uri;
        link.click();*/

        // split into mime + base64
        const [prefix, rawBase64] = uri.split(",");
        const mime = prefix.match(/data:(.*);base64/)?.[1] || "image/png";

        // choose target folder (same as original image for example)
        const folder = image!.parentFolder! as MediaFolder;

        // generate new name
        const filename = `drawing-${Date.now()}.png`;
        onClose();
        const new_image = await LocalImage.fromBase64({ rawBase64, mime }, folder, filename);
        new_image.copyToClipboard();        
        folder.setSelectedMedia(new_image);
    };

    const containerRef = useRef<HTMLDivElement | null>(null);


    const getStagePoint = (stage: Konva.Stage) => {
        const pos = stage.getPointerPosition();
        if (!pos) return null;
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        return transform.point(pos);
    };

    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const imageW = imgSize?.width ?? 1;
    const imageH = imgSize?.height ?? 1;

    const zoom = Math.min((size.height - 50) / imageH, size.width / imageW);

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
            }}
        >

            {/* Canvas wrapper (optional scroll for large images) */}
            <div ref={containerRef} style={{
                background: "#0000002e",
                position: "absolute",
                top: 50 * 0.5,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}            >
                <Stage
                    ref={stageRef}
                    width={imageW * zoom}
                    height={imageH * zoom}
                    scaleX={zoom}
                    scaleY={zoom}
                    style={{
                        background: "white",
                        width: imageW * zoom,
                        height: imageH * zoom,
                    }}

                    onMouseDown={(e) => {
                        isDrawing.current = true;
                        const stage = e.target.getStage();
                        if (!stage) return;
                        const pos = getStagePoint(stage);
                        if (!pos) return;

                        setLines((prev) => [
                            ...prev,
                            {
                                points: [pos.x, pos.y],
                                color,
                                strokeWidth,
                            },
                        ]);
                    }}
                    onMouseMove={(e) => {
                        if (!isDrawing.current) return;

                        const stage = e.target.getStage();
                        if (!stage) return;
                        const point = getStagePoint(stage);
                        if (!point) return;

                        setLines((prev) => {
                            const last = prev[prev.length - 1];
                            if (!last) return prev;

                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                ...last,
                                points: last.points.concat([point.x, point.y]),
                            };
                            return updated;
                        });
                    }}
                    onMouseUp={() => {
                        isDrawing.current = false;
                    }}
                >
                    {/* 🖼 Background image (natural size, no scaling) */}
                    <Layer>
                        {bgImage && imgSize && (
                            <KonvaImage
                                image={bgImage}
                                width={imgSize.width}
                                height={imgSize.height}
                            />
                        )}
                    </Layer>

                    {/* ✏️ Drawing layer */}
                    <Layer>
                        {lines.map((line, i) => (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth}
                                tension={0.2}
                                lineCap="round"
                                lineJoin="round"
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* Toolbar overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 3,
                    background: "rgba(206, 206, 206, 0.9)",
                    borderRadius: 8,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                }}
            >
                {/* Actions */}
                <Form.Range
                    min={1}
                    max={20}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    style={{ width: 120 }}
                />
                <Form.Control
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
                <ButtonGroup>


                    <Button onClick={exportToPNG} variant="success"><FontAwesomeIcon icon={faFloppyDisk} /></Button>
                    <Button variant="secondary" onClick={() => setLines([])}>Clear <FontAwesomeIcon icon={faArrowRotateLeft} /></Button>
                    <Button variant="danger" onClick={onClose}>X</Button>
                </ButtonGroup>




            </div>

        </div>

    );
};

export default DrawingCanvas;