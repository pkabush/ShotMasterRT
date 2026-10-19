import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../../../classes/Shot";
import { Button } from "react-bootstrap";
import { CroppedMediaImage } from "./CroppedMediaImage";
import { LocalImage } from "../../../../../../classes/fileSystem/LocalImage";
import SettingsButton from "../../../../../Atomic/SettingsButton";
import LoadingSpinner from "../../../../../Atomic/LoadingSpinner";
import SimpleSelect from "../../../../../Atomic/SimpleSelect";
import { Action_generatePrevisAudioGoogleAll } from "./PrevisGenerateAudioGoogle";
import { Previs_getAllDialogueSpeakers } from "./Previs_AudioTextUtils";
import { GoogleAI } from "../../../../../../classes/GoogleAI";
import { Action_Previs_combineAudioWithImages, Previs_GetShotsJson, Previs_GetShotsOrder, updatePrevisVoice } from "./Previs_Actions";
import { Previs_ShotPreviewItem } from "./Previs_TilePreview";

// Autoplay Store
import { create } from "zustand";
import EditableJsonTextField from "../../../../../EditableJsonTextField";

interface PrevisStore {
    autoplay: boolean;
    setAutoplay: (value: boolean) => void;
    toggleAutoplay: () => void;
}

export const usePrevisStore = create<PrevisStore>((set) => ({
    autoplay: false,

    setAutoplay: (value) => set({ autoplay: value }),

    toggleAutoplay: () =>
        set((state) => ({ autoplay: !state.autoplay })),
}));
//Store



interface Props {
    shot: Shot;
}



const wf_name = "shot_previs_generate_audio"
const wf_loading_audio = `${wf_name}/loading_audio`
//const wf_name_audio = `${wf_name}_audio`








export const Previs_ShotJsonPreview: React.FC<Props> = observer(({ shot }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    // autoplay
    const previs_json = Previs_GetShotsJson(shot);
    const shots = previs_json.shots ?? [];
    //const shots = Previs_GetShotsOrdered(shot);
    const shots_order_indexes = Previs_GetShotsOrder(shot);

    const updateShot = (
        index: number,
        field: "image_prompt" | "audio_text" | "image_path" | "audio_voice",
        value: string
    ) => {
        previs_json.shots[index][field] = value;
        const newJson = JSON.stringify(previs_json, null, 2);
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
    const speakers = Previs_getAllDialogueSpeakers(shot);


    return (
        <div>
            <SettingsButton content={<>
                <EditableJsonTextField localJson={shot.shotJson} field="previs_json" fitHeight collapsed />
            </>} className="mb-2" buttons={
                <>
                    <Button
                        size="sm"
                        variant="outline-success"
                        disabled={loading_audio}
                        onClick={() => { Action_generatePrevisAudioGoogleAll(shot); }}
                    >
                        Generate All Audio GOOGLE
                    </Button>

                    <LoadingSpinner isLoading={loading_audio} asButton />

                    <SimpleSelect
                        value={"Set speed on All"}
                        options={["Set speed on All", "1.0", "1.25", "1.5", "1.75", "2.0"]}
                        onChange={(val) => {
                            const data = previs_json;
                            data.shots?.forEach((s: any) => { s.playback_speed = val; });
                            shot.shotJson?.updateField("previs_json", JSON.stringify(data, null, 2));
                        }}
                    />

                    <Button
                        size="sm"
                        variant="outline-success"
                        disabled={loading_audio}
                        onClick={() => { Action_Previs_combineAudioWithImages(shot); }}
                    >
                        Generate Final Video
                    </Button>

                </>
            } />

            {/* Preview images strip */}
            <div
                className="d-flex mb-3 p-1 border rounded"
                style={{ width: "100%", gap: "3px", overflow: "hidden", }}
            >
                {shots_order_indexes.map((index: number) => {
                    const shotData = shots[index];
                    if (!shotData) return null;

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
                    onUpdateField={(field, val) => updateShot(selectedIndex, field, val)}
                    setSelectedIndex={setSelectedIndex}
                />
            )}


            <h4>Voice Map</h4>
            { false && <>
            {speakers.map((speaker) => {
                const voice_map = previs_json.voices ?? {};
                return <div key={speaker}>
                    <SimpleSelect
                        label={speaker}
                        options={GoogleAI.options.audio_generation.voices}
                        value={voice_map[speaker] ?? "Kale"}
                        onChange={(val) => {
                            const audio = new Audio(`assets/sounds/VoicesGoogle/${val}.mp3`);
                            audio.volume = 0.25;
                            audio.currentTime = 0;
                            audio.play().catch((err) => { console.error("Failed to play sound:", err); });
                            updatePrevisVoice(shot, speaker, val,);
                        }}
                    />
                </div>
            })}

            </>}

            


        </div >
    );
});



