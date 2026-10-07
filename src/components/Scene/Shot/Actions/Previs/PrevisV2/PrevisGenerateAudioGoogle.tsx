import React from "react";
import { Button } from "react-bootstrap";
import type { Shot } from "../../../../../../classes/Shot";
import { LocalAudio } from "../../../../../../classes/fileSystem/LocalAudio";
import SettingsButton from "../../../../../Atomic/SettingsButton";
import LoadingSpinner from "../../../../../Atomic/LoadingSpinner";
import { getPrevisShotByIndex, Previs_GetShotsJson } from "./PrevisShotsJsonPreview";
import { GoogleAI } from "../../../../../../classes/GoogleAI";
import { Previs_applyVoiceMap, Previs_parseDialogue } from "./Previs_AudioTextUtils";
import { combineAudioFromBlobs } from "../../../../../../classes/Ffmpeg/FFmpegService";


interface Props {
    shot: Shot;
    audioIndex: number;
}

const Previs_GenerateAudioGoogle: React.FC<Props> = ({
    shot,
    audioIndex,
}) => {
    const shotData = getPrevisShotByIndex(shot, audioIndex);
    if (!shotData) { return null; }
    return (
        <SettingsButton
            className="mb-2 "
            buttons={
                <>
                    <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => Action_generatePrevisAudioGoogle(shot, audioIndex)}
                    >
                        Generate Audio Google
                    </Button>


                    <LoadingSpinner
                        isLoading={false}
                        asButton
                    />
                </>
            }
            content={<></>}
        />
    );
};

export default Previs_GenerateAudioGoogle;



export const Action_generatePrevisAudioGoogle = async (
    shot: Shot,
    index: number,
): Promise<void> => {
    const shotData = getPrevisShotByIndex(shot, index);

    if (!shotData) {
        return;
    }

    const audioText = shotData.audio_text ?? "";
    const audioName = `audio_shot_${index}.mp3`;

    console.log("GENERATE AUDIO Google:", audioText);

    const dialogue = Previs_parseDialogue(audioText);
    console.log("Dialogue:", dialogue);

    const previsJson = Previs_GetShotsJson(shot);
    const voiceMap = previsJson.voices ?? {};

    const dialogueWithVoices = Previs_applyVoiceMap(
        dialogue,
        voiceMap,
    );

    const speakers = Array.from(
        new Set(dialogueWithVoices.map((line) => line.speaker)),
    );

    // More than 2 speakers:
    // Generate each line separately and combine them.
    if (speakers.length > 2) {
        const audioBlobs = await Promise.all(
            dialogueWithVoices.map((line, i) => {
                console.log(
                    `Generating audio ${i + 1}/${dialogueWithVoices.length}`,
                    line,
                );

                return GoogleAI.generateAudio([line]);
            }),
        );

        const validAudioBlobs = audioBlobs.filter(
            (audio): audio is Blob => audio instanceof Blob,
        );

        if (validAudioBlobs.length === 0) {
            console.warn("No audio was generated.");
            return;
        }

        const combinedAudio = await combineAudioFromBlobs(
            validAudioBlobs,
        );

        await LocalAudio.fromBlob(
            combinedAudio,
            shot.MediaFolder_results!,
            audioName,
        );

        return;
    }

    // 2 or fewer speakers:
    // Generate the complete dialogue in one request.
    const audio = await GoogleAI.generateAudio(dialogueWithVoices);

    console.log("Audio Generated");

    if (audio) {
        await LocalAudio.fromBlob(
            audio,
            shot.MediaFolder_results!,
            audioName,
        );
    }
};


const wf_name = "shot_previs_generate_audio"
const wf_loading_audio = `${wf_name}/loading_audio`


export const Action_generatePrevisAudioGoogleAll = async (
    shot: Shot,
): Promise<void> => {
    shot.shotJson?.updateField(wf_loading_audio, true);


    try {
        const previsJson = Previs_GetShotsJson(shot);
        const shots = previsJson.shots ?? [];

        const indexes: number[] = shots
            .map((shotData: any, index: number) =>
                shotData?.audio_text?.trim()
                    ? index
                    : -1
            )
            .filter((index: number) => index !== -1);

        console.log(`Generating ${indexes.length} Google audio files in parallel...`);

        await Promise.all(
            indexes.map(async (index: number) => {
                try {
                    await Action_generatePrevisAudioGoogle(shot, index,);
                    console.log(`Google audio generated for shot ${index}.`);
                } catch (error) {
                    console.error(`Failed to generate Google audio for shot ${index}:`, error,);
                }
            }),
        );

        console.log(
            "Finished generating all Google previs audio."
        );
    } finally {
        shot.shotJson?.updateField(wf_loading_audio, false);
    }
};

