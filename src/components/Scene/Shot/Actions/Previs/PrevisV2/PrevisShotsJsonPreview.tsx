import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../../../classes/Shot";
import { Form, Row, Col, Button } from "react-bootstrap";
import { CroppedMediaImage } from "./CroppedMediaImage";
import { LocalImage } from "../../../../../../classes/fileSystem/LocalImage";
import SettingsButton from "../../../../../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../../../../../WorkflowOptionSelect";
import { ChatGPT } from "../../../../../../classes/ChatGPT";
import LoadingSpinner from "../../../../../Atomic/LoadingSpinner";
import { LocalAudio } from "../../../../../../classes/fileSystem/LocalAudio";
import InlineAudio from "../../../../../MediaComponents/InlineAudio";
import SimpleSelect from "../../../../../Atomic/SimpleSelect";
import { extractImageTile } from "../ImageSplitUtils";
import { mb_createVideoFromImageAndAudio } from "../../../../../../classes/Ffmpeg/mediabunnyService";
import { combineVideosFromBlobs } from "../../../../../../classes/Ffmpeg/FFmpegService";

interface Props {
    shot: Shot;
}

interface EditableTextAreaProps {
    value: string;
    onSave: (value: string) => void;
}

interface ShotPreviewItemProps {
    shotData: any;
    shot: Shot;
    shotIndex: number;
    onUpdateField: (field: "image_prompt" | "audio_text" | "image_path" | "audio_voice", value: string) => void;
}

const wf_name = "shot_previs_generate_audio"
const wf_loading_audio = `${wf_name}/loading_audio`
const wf_name_audio = `${wf_name}_audio`

const EditableTextArea: React.FC<EditableTextAreaProps> = ({ value, onSave }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => { setLocalValue(value); }, [value]);

    return (
        <Form.Control
            as="textarea"
            rows={4}
            value={localValue}

            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => { if (localValue !== value) { onSave(localValue); } }}
        />
    );
};

export const Previs_ShotPreviewItem: React.FC<ShotPreviewItemProps> = ({ shotData, shot, onUpdateField, shotIndex }) => {
    // Image
    const image_path = shotData.image_path;
    const shot_image = image_path ? shot.getByPath(shotData.image_path) as LocalImage : shot.first_frame;
    const var_images = shot.MediaFolder_results?.getType(LocalImage);
    // Audio
    const audio_name = `audio_shot_${shotIndex}.mp3`;
    const audio_path = `${shot.MediaFolder_results?.path}/${audio_name}`;
    const audio_file = shot.MediaFolder_results?.getByPath(audio_path, LocalAudio);
    //console.log(audio_name, audio_path, audio_file);

    return (
        <>
            <div className="border rounded p-3 mb-3">
                <Row className="align-items-start">
                    {/* Left Column: Image Preview */}
                    <Col md={3} className="mb-3 mb-md-0">
                        {shot_image ? (
                            <CroppedMediaImage
                                localImage={shot_image}
                                shotIndex={shotIndex}
                                className="rounded border"
                            />
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

                                    return (
                                        <div
                                            key={imageIndex}
                                            onClick={() => {
                                                onUpdateField("image_path", image.path);
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                borderRadius: "6px",
                                                padding: "2px",
                                                boxShadow: isSelected
                                                    ? "0 0 6px 2px rgba(0, 180, 255, 0.9), 0 0 14px 4px rgba(0, 180, 255, 0.45)"
                                                    : "none",
                                                transition:
                                                    "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
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

                        <SettingsButton
                            className="mb-2 mt-2"
                            buttons={
                                <>
                                    <Button size="sm" variant="outline-success" onClick={async () => {
                                        console.log("GENERATE AUDIO", shotData.audio_text);

                                        const workflow = shot.scene.project.workflows[wf_name_audio];

                                        const audio = await ChatGPT.generateAudio(
                                            shotData.audio_text,
                                            shotData.audio_voice ?? "nova",
                                            workflow.model ?? "tts-1-hd",
                                            undefined,
                                            undefined,
                                            Number(workflow.speed ?? "1.25"),
                                        );

                                        console.log("Audio Generated");

                                        if (audio) {
                                            const local_audio = await LocalAudio.fromBlob(audio, shot.MediaFolder_results!, audio_name);
                                            return local_audio;
                                        }
                                    }}>
                                        Generate Audio GPT
                                    </Button>


                                    {false && <WorkflowOptionSelect
                                        workflowName={wf_name_audio}
                                        optionName={"voice"}
                                        values={ChatGPT.options.audio_generation.voices}
                                    />}

                                    <SimpleSelect
                                        options={ChatGPT.options.audio_generation.voices}
                                        value={shotData.audio_voice ?? "nova"}
                                        onChange={(val) => {
                                            onUpdateField("audio_voice", val)
                                        }}
                                    />

                                    <WorkflowOptionSelect
                                        workflowName={wf_name_audio}
                                        optionName={"model"}
                                        values={ChatGPT.options.audio_generation.models}
                                    />

                                    <WorkflowOptionSelect
                                        workflowName={wf_name_audio}
                                        optionName={"speed"}
                                        values={ChatGPT.options.audio_generation.speed}
                                        defaultValue="1.25"
                                    />

                                    <LoadingSpinner isLoading={false} asButton />

                                </>
                            }
                            content={<></>}
                        />

                        {audio_file ? <InlineAudio localAudio={audio_file} /> : <>No Audio</>}

                    </Col>
                </Row>
            </div>
        </>
    );
};

export const Previs_ShotJsonPreview: React.FC<Props> = observer(({ shot }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const shotJsonData = shot.shotJson?.getField("previs_json") ?? null;

    const shotsJson = shotJsonData
        ? JSON.parse(shotJsonData)
        : { shots: Array.from({ length: 16 }, () => ({})), };

    const shots = shotsJson.shots ?? [];

    const updateShot = (
        index: number,
        field: "image_prompt" | "audio_text" | "image_path" | "audio_voice",
        value: string
    ) => {
        shotsJson.shots[index][field] = value;
        const newJson = JSON.stringify(shotsJson, null, 2);
        shot.shotJson?.updateField("previs_json", newJson);
    };

    // Keep selected index valid if shots change
    useEffect(() => {
        if (selectedIndex >= shots.length) {
            setSelectedIndex(Math.max(0, shots.length - 1));
        }
    }, [shots.length, selectedIndex]);

    const selectedShot = shots[selectedIndex];
    const loading_audio = shot.shotJson?.getField(wf_loading_audio) ?? false;

    return (
        <div>
            <br />
            <SettingsButton content={<></>} className="mb-2" buttons={
                <>
                    <Button
                        size="sm"
                        variant="outline-success"
                        disabled={loading_audio}
                        onClick={() => { Action_Previs_Generate_AllAudioFromJson(shot); }}
                    >
                        Generate All Audio
                    </Button>

                    <LoadingSpinner isLoading={loading_audio} asButton />                    

                    <Button
                        size="sm"
                        variant="outline-success"
                        disabled={loading_audio}
                        onClick={() => { Action_Previs_generate_AudioMultiline(shot); }}
                    >Generate Final Video</Button>
                </>
            } />


            {/* Preview images strip */}
            <div
                className="d-flex mb-3 p-1 border rounded"
                style={{ width: "100%", gap: "3px", overflow: "hidden", }}
            >
                {shots.map((shotData: any, index: number) => {
                    const image_path = shotData.image_path;
                    const shot_image = image_path
                        ? (shot.getByPath(image_path) as LocalImage)
                        : shot.first_frame;

                    const isSelected = selectedIndex === index;

                    return (
                        <div
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            style={{
                                flex: "1 1 0",
                                minWidth: 0,
                                aspectRatio: "9 / 16",
                                cursor: "pointer",
                                padding: "2px",
                                borderRadius: "6px",
                                boxShadow: isSelected
                                    ? "0 0 6px 2px rgba(0, 180, 255, 0.9), 0 0 14px 4px rgba(0, 180, 255, 0.45)"
                                    : "none",
                                transform: isSelected
                                    ? "scale(1.03)"
                                    : "scale(1)",
                                transition:
                                    "box-shadow 0.15s ease, transform 0.15s ease",
                            }}
                        >
                            {shot_image ? (
                                <CroppedMediaImage
                                    localImage={shot_image}
                                    shotIndex={index}
                                    className="rounded"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                    }}
                                />
                            ) : (
                                <div
                                    className="d-flex align-items-center justify-content-center bg-secondary text-white rounded"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        fontSize: "0.65rem",
                                    }}
                                >
                                    No Image
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Only show the selected shot */}
            {selectedShot && (
                <Previs_ShotPreviewItem
                    shotIndex={selectedIndex}
                    shot={shot}
                    shotData={selectedShot}
                    onUpdateField={(field, val) =>
                        updateShot(selectedIndex, field, val)
                    }
                />
            )}

            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
        </div>
    );
});



export async function Action_Previs_Generate_AllAudioFromJson(shot: Shot) {
    shot.shotJson?.updateField(wf_loading_audio, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name_audio];

        if (!workflow) {
            console.error(`Workflow not found: ${wf_name_audio}`);
            return;
        }

        const previsJson = shot.shotJson?.getField("previs_json");

        if (!previsJson) {
            console.warn("No previs_json found.");
            return;
        }

        let shotsJson: any;

        try {
            shotsJson = JSON.parse(previsJson);
        } catch (error) {
            console.error("Failed to parse previs_json:", error);
            return;
        }

        const shots = shotsJson?.shots;

        if (!Array.isArray(shots)) {
            console.warn("previs_json does not contain a shots array.");
            return;
        }

        if (!shot.MediaFolder_results) {
            console.error("MediaFolder_results is not available.");
            return;
        }

        const model = workflow.model ?? "tts-1-hd";
        const speed = Number(workflow.speed ?? "1.0");

        // Only generate audio for shots that actually contain text.
        const jobs = shots
            .map((shotData: any, index: number) => ({
                shotData,
                index,
            }))
            .filter(({ shotData }: { shotData: any }) =>
                shotData?.audio_text?.trim()
            );

        console.log(`Generating ${jobs.length} audio files in parallel...`);

        await Promise.all(
            jobs.map(async ({ shotData, index }) => {
                const audio_name = `audio_shot_${index}.mp3`;

                console.log(
                    `Generating audio for shot ${index}:`,
                    audio_name
                );

                try {
                    const audio = await ChatGPT.generateAudio(
                        shotData.audio_text,
                        shotData.audio_voice ?? "nova",
                        model,
                        undefined,
                        undefined,
                        speed,
                    );

                    if (!audio) {
                        console.warn(
                            `No audio returned for shot ${index}`
                        );
                        return;
                    }

                    await LocalAudio.fromBlob(
                        audio,
                        shot.MediaFolder_results!,
                        audio_name
                    );

                    console.log(
                        `Audio generated for shot ${index}:`,
                        audio_name
                    );
                } catch (error) {
                    // Don't let one failed request cancel all the others.
                    console.error(
                        `Failed to generate audio for shot ${index}:`,
                        error
                    );
                }
            })
        );

        console.log("Finished generating all previs audio.");

    } finally {
        shot.shotJson?.updateField(wf_loading_audio, false);
    }
}




export async function Action_Previs_generate_AudioMultiline(
    shot: Shot
) {
    try {
        const previsJson =
            shot.shotJson?.getField("previs_json");

        if (!previsJson) {
            console.warn("No previs_json found.");
            return;
        }

        let shotsJson: any;

        try {
            shotsJson = JSON.parse(previsJson);
        } catch (error) {
            console.error(
                "Failed to parse previs_json:",
                error
            );
            return;
        }

        const shots = shotsJson?.shots;

        if (!Array.isArray(shots)) {
            console.warn(
                "previs_json does not contain a shots array."
            );
            return;
        }

        if (!shot.MediaFolder_results) {
            console.error(
                "MediaFolder_results is not available."
            );
            return;
        }

        const rows = 4;
        const columns = 4;

        // ---------------------------------------------------------
        // Create one video for every previs shot.
        // ---------------------------------------------------------

        const video_blobs = (
            await Promise.all(
                shots.map(async (shotData: any, index: number) => {
                    console.log(`Processing previs shot ${index}...`);

                    try {
                        // -------------------------------------------------
                        // Extract the corresponding image tile.
                        // -------------------------------------------------

                        // Image
                        const image_path = shotData.image_path;
                        const shot_image = image_path ? shot.getByPath(shotData.image_path) as LocalImage : shot.first_frame;

                        if (!shot_image) {
                            console.error(
                                "No Image selected for shot."
                            );
                            return;
                        }

                        const tile = await extractImageTile(
                            shot_image,
                            rows,
                            columns,
                            index
                        );

                        console.log(
                            `Extracted tile ${index}:`,
                            {
                                row: tile.row,
                                column: tile.column,
                                x: tile.x,
                                y: tile.y,
                                width: tile.width,
                                height: tile.height,
                            }
                        );

                        // -------------------------------------------------
                        // Load existing audio.
                        // -------------------------------------------------

                        const audioName =
                            `audio_shot_${index}.mp3`;

                        const audioPath =
                            `${shot.MediaFolder_results!.path}/${audioName}`;

                        const audioFile =
                            shot.MediaFolder_results!.getByPath(
                                audioPath,
                                LocalAudio
                            );

                        if (!audioFile) {
                            console.warn(
                                `No audio found for shot ${index}:`,
                                audioPath
                            );

                            return null;
                        }

                        // Get the audio as a Blob.
                        const audioBlob =
                            await audioFile.getBlob();

                        // -------------------------------------------------
                        // Create video from image + existing audio.
                        // -------------------------------------------------

                        console.log(
                            `Creating video for shot ${index}...`
                        );

                        const video =
                            await mb_createVideoFromImageAndAudio(
                                tile.blob,
                                audioBlob
                            );

                        return video;

                    } catch (error) {
                        console.error(
                            `Failed to process shot ${index}:`,
                            error
                        );

                        return null;
                    }
                })
            )
        ).filter(
            (video): video is Blob => video != null
        );

        console.log(
            `Created ${video_blobs.length} shot videos.`
        );

        if (video_blobs.length === 0) {
            console.warn(
                "No videos were created."
            );
            return;
        }

        // ---------------------------------------------------------
        // Combine all shot videos.
        // ---------------------------------------------------------

        console.log("Combining shot videos...");

        const blob_final =
            await combineVideosFromBlobs(video_blobs);

        // ---------------------------------------------------------
        // Download final video.
        // ---------------------------------------------------------

        const url =
            URL.createObjectURL(blob_final);

        const a =
            document.createElement("a");

        a.href = url;
        a.download =
            "previs_audio_multiline.mp4";

        a.click();

        URL.revokeObjectURL(url);

        console.log(
            "Previs video generated successfully."
        );

    } finally {
        console.log("Video_Generated");
    }
}
