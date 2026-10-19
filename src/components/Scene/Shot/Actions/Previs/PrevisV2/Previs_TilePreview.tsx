import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../../../classes/Shot";
import { LocalImage } from "../../../../../../classes/fileSystem/LocalImage";
import { LocalAudio } from "../../../../../../classes/fileSystem/LocalAudio";
import { Previs_GetShotsOrder, subtitles_path, updatePrevisShot, updatePrevisShotOrder } from "./Previs_Actions";
import { Button, Col, Form, Row, Stack } from "react-bootstrap";
import { CroppedMediaImage } from "./CroppedMediaImage";
import { EditableTextArea } from "./EditableTextArea";
import Previs_GenerateAudioGPT from "./Previs_GenerateAudioGPT";
import Previs_GenerateAudioGoogle from "./PrevisGenerateAudioGoogle";
import { extractImageTile } from "../ImageSplitUtils";
import { EditableJsonToggleButton } from "../../../../../EditableJsonTextField";
import InlineAudio, { type InlineAudioHandle } from "../../../../../MediaComponents/InlineAudio";
import SimpleSelect from "../../../../../Atomic/SimpleSelect";
import { usePrevisStore } from "./PrevisShotsJsonPreview";
import { useEffect, useRef } from "react";



interface ShotPreviewItemProps {
    shotData: any;
    shot: Shot;
    shotIndex: number;
    onUpdateField: (field: "image_prompt" | "audio_text" | "image_path" | "audio_voice", value: string) => void;
    setSelectedIndex: (index: number) => void;
}


export const Previs_ShotPreviewItem: React.FC<ShotPreviewItemProps> = observer(({
    shotData,
    shot,
    onUpdateField,
    shotIndex,
    setSelectedIndex,
}) => {

    const autoplay = usePrevisStore((state) => state.autoplay);
    const toggleAutoplay = usePrevisStore((state) => state.toggleAutoplay);

    const audio_ref = useRef<InlineAudioHandle>(null);

    useEffect(() => {
        if (autoplay) audio_ref.current?.play();
        else audio_ref.current?.pause();
    }, [autoplay])

    // Image
    const image_path = shotData.image_path;
    const shot_image = image_path ? shot.getByPath(shotData.image_path) as LocalImage : shot.first_frame;
    const var_images = shot.MediaFolder_results?.getType(LocalImage);
    // Audio
    const audio_name = `audio_shot_${shotIndex}.mp3`;
    const audio_path = `${shot.previs_audio_folder?.path}/${audio_name}`;
    const audio_file = shot.previs_audio_folder?.getByPath(audio_path, LocalAudio);
    //console.log(audio_name, audio_path, audio_file);

    const playback_rate = shotData.playback_speed ?? "1.0";
    const use_subs = shot.scene.project.projinfo!.getField(subtitles_path);

    return (
        <>
            <div className="border rounded p-3 mb-3">
                <Row className="align-items-start">
                    {/* Left Column: Image Preview */}

                    {/* Left Column: Image Preview */}
                    <Col md={3} className="mb-3 mb-md-0">
                        {shot_image ? (
                            <div
                                className="position-relative rounded border overflow-hidden"
                                style={{ width: "100%", containerType: "inline-size", }}
                            >
                                <CroppedMediaImage
                                    localImage={shot_image}
                                    shotIndex={shotIndex}
                                    className="rounded"
                                    style={{
                                        display: "block",
                                        width: "100%",
                                    }}
                                />

                                {/* Audio text overlay */}
                                {use_subs && shotData.audio_text?.trim() && (
                                    <div
                                        className="position-absolute start-0 w-100"
                                        style={{
                                            bottom: "20%",
                                            color: "#ffffffed",
                                            padding: "2%",
                                            fontSize: "5cqw",
                                            fontWeight: 600,
                                            lineHeight: 1.4,
                                            maxHeight: "45%",
                                            overflowY: "auto",
                                            overflowWrap: "anywhere",
                                            whiteSpace: "pre-wrap",
                                            boxSizing: "border-box",
                                            textAlign: "center",
                                            textShadow: `
                                                -1px -1px 2px rgba(0, 0, 0, 0.95),
                                                1px -1px 2px rgba(0, 0, 0, 0.95),
                                                -1px 1px 2px rgba(0, 0, 0, 0.95),
                                                1px 1px 2px rgba(0, 0, 0, 0.95),
                                                0px 2px 4px rgba(0, 0, 0, 1)
                                            `,
                                        }}
                                    >
                                        {shotData.audio_text}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="d-flex align-items-center justify-content-center bg-secondary text-white rounded"
                                style={{ height: "180px", fontSize: "0.875rem" }}
                            >
                                No Image Available
                            </div>
                        )}
                    </Col>

                    {/* Right Column: Text Fields */}
                    <Col md={9}>
                        {/* Small image previews */}
                        {var_images && var_images.length > 0 && (
                            <div
                                className="d-flex gap-2 p-2"
                                style={{
                                    overflowX: "auto",
                                    paddingBottom: "8px",
                                }}
                            >
                                {var_images.map((image: LocalImage, imageIndex: number) => {
                                    const isSelected = shot_image?.path === image.path;
                                    const storyboard_index = image.mediaJson?.getField("storyboard_index");
                                    const isStoryboardImage = storyboard_index != null;

                                    if (isStoryboardImage && (shotIndex != storyboard_index))
                                        return null;

                                    return (
                                        <div
                                            key={imageIndex}
                                            onClick={() => onUpdateField("image_path", image.path)}
                                            style={{
                                                cursor: "pointer",
                                                borderRadius: "6px",
                                                padding: "2px",
                                                boxShadow: isSelected
                                                    ? "0 0 6px 2px rgba(0, 180, 255, 0.9), 0 0 14px 4px rgba(0, 180, 255, 0.45)"
                                                    : "none",
                                                transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                                                transform: isSelected ? "scale(1.03)" : "scale(1)",
                                            }}
                                        >
                                            <CroppedMediaImage
                                                localImage={image}
                                                shotIndex={shotIndex}
                                                className="rounded border-0 flex-shrink-0"
                                                style={{
                                                    width: "90px",
                                                    height: "160px",
                                                    ...(isStoryboardImage
                                                        ? { objectFit: "contain" }
                                                        : {}),
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <EditableTextArea
                                value={shotData.image_prompt ?? ""}
                                onSave={(val) => onUpdateField("image_prompt", val)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-0">
                            <EditableTextArea
                                value={shotData.audio_text ?? ""}
                                onSave={(val) => onUpdateField("audio_text", val)}
                            />
                        </Form.Group>

                        {false && <Previs_GenerateAudioGPT shot={shot} audioIndex={shotIndex} />}

                        <Stack direction="horizontal" gap={3} className="text-nowrap">
                            <Previs_GenerateAudioGoogle shot={shot} audioIndex={shotIndex} />

                            <Button
                                size="sm"
                                variant="outline-warning"
                                onClick={async () => {
                                    console.log("Extract");
                                    if (!shot_image) {
                                        console.log("No Shot Image");
                                        return;
                                    }

                                    const tile = await extractImageTile(shot_image, 4, 4, shotIndex);
                                    const extracted_image = await LocalImage.fromBlob(tile.blob, shot.MediaFolder_results!, `${shot_image.name_no_extension}.preview_tile_${shotIndex}.png`);
                                    extracted_image.mediaJson!.updateField("storyboard_index", shotIndex);
                                }}
                            >Extract Image</Button>

                            {/**
                            <Button
                                size="sm"
                                variant="outline-warning"
                                onClick={async () => {
                                    console.log("Extract");
                                    if (!shot_image) {
                                        console.log("No Shot Image");
                                        return;
                                    }

                                    const blob = await bakeTextOntoImage(await shot_image.toBlob(), shotData.audio_text?.trim());
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "previs_audio_multiline.png";
                                    a.click();
                                    URL.revokeObjectURL(url);

                                }}
                            >Bake text</Button>
                             */}

                            <Button size="sm" variant="outline-warning"
                                onClick={() => { updatePrevisShotOrder(shot, shotIndex, - 1); }}
                            >
                                {"<"}
                            </Button>

                            <Button size="sm" variant="outline-warning"
                                onClick={() => { updatePrevisShotOrder(shot, shotIndex, 1); }}
                            >
                                {">"}
                            </Button>

                            <EditableJsonToggleButton field={subtitles_path} localJson={shot.scene.project.projinfo!} default_val={use_subs} label="Add Subtitles" />

                        </Stack>

                        {audio_file ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Button
                                    size="sm"
                                    variant={autoplay ? "warning" : "outline-secondary"}
                                    onClick={toggleAutoplay}
                                >
                                    Autoplay
                                </Button>

                                <InlineAudio
                                    ref={audio_ref}
                                    playbackRate={Number(playback_rate)}
                                    localAudio={audio_file}
                                    onFinished={() => {
                                        if (!autoplay) return;
                                        const shots_order = Previs_GetShotsOrder(shot);
                                        const next_index = shots_order[(shots_order.indexOf(shotIndex) + 1)%16];                                        
                                        setSelectedIndex(next_index);
                                    }}
                                    onPause={() => {
                                        //setAutoplay(false);
                                    }}
                                    autoPlay={autoplay}
                                />

                                <div style={{ minWidth: 125 }}>
                                    <SimpleSelect
                                        value={playback_rate}
                                        options={["1.0", "1.25", "1.5", "1.75", "2.0"]}
                                        label="Speed"
                                        onChange={(val) => {
                                            updatePrevisShot(
                                                shot,
                                                shotIndex,
                                                "playback_speed",
                                                val
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>No Audio</>
                        )}



                    </Col>
                </Row>
            </div>
        </>
    );
});