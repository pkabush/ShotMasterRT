import { observer } from "mobx-react-lite";
import type { Scene } from "../../../../../../classes/Scene";
import { Previs_getAllDialogueSpeakers } from "./Previs_AudioTextUtils";
import SimpleSelect from "../../../../../Atomic/SimpleSelect";
import { GoogleAI } from "../../../../../../classes/GoogleAI";
import { useRef } from "react";
import { EditableJsonToggleButton } from "../../../../../EditableJsonTextField";

interface Props {
    scene: Scene;
}


export const scene_previs_voiceMapField = "previs/previs_voice_map";
export const show_all_speakers_field = "settings/previs/voice_map/show_all_speakers"

export const Previs_SceneSpeakersMap: React.FC<Props> = observer(({ scene }) => {
    const currentAudio = useRef<HTMLAudioElement | null>(null);

    const voice_map = scene.sceneJson?.getField(scene_previs_voiceMapField) ?? {};

    const uniqueSpeakers = [
        ...new Set(
            scene.shots_ordered.flatMap(shot =>
                Previs_getAllDialogueSpeakers(shot)
            )
        )
    ];

    const current_shot_voices = scene.selectedShot
        ? Previs_getAllDialogueSpeakers(scene.selectedShot)
        : [];

    const show_all_speakers =
        scene.project.projinfo?.getField(show_all_speakers_field) ?? false;

    const speakersToShow = show_all_speakers
        ? uniqueSpeakers
        : current_shot_voices;


    return (
        <>
            <EditableJsonToggleButton localJson={scene.project.projinfo} field={show_all_speakers_field} default_val={false} label="Show All Speakers" />

            {speakersToShow.map((speaker) => {

                const isCurrentShotVoice = current_shot_voices.includes(speaker);

                return (
                    <div key={speaker}>
                        <SimpleSelect
                            label={speaker}
                            labelClassName={isCurrentShotVoice ? "btn-outline-warning" : "btn-outline-secondary"}
                            options={GoogleAI.options.audio_generation.voices}
                            value={
                                voice_map[speaker] ??
                                GoogleAI.options.audio_generation.voices[0]
                            }
                            onChange={(val) => {
                                // Stop the previous audio
                                if (currentAudio.current) {
                                    currentAudio.current.pause();
                                    currentAudio.current.currentTime = 0;
                                }

                                // Play the new audio
                                const audio = new Audio(`assets/sounds/VoicesGoogle/${val}.mp3`);

                                currentAudio.current = audio;
                                audio.volume = 0.25;

                                audio.play().catch((err) => {
                                    console.error("Failed to play sound:", err);
                                });

                                updatePrevisVoice(scene, speaker, val);
                            }}
                        />
                    </div>
                )
            })}
        </>
    );
});


export function updatePrevisVoice(
    scene: Scene,
    speaker: string,
    voice: string,
) {
    scene.sceneJson?.updateField(`${scene_previs_voiceMapField}/${speaker}`, voice);
}

export function getSceneVoiceMap(scene: Scene) {
    return scene.sceneJson?.getField(scene_previs_voiceMapField) ?? {};
}