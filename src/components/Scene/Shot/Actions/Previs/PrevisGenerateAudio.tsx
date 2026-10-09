
import type { Shot } from "../../../../../classes/Shot";
import { observer } from "mobx-react-lite";
import SettingsButton from "../../../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../../WorkflowOptionSelect";
import LoadingSpinner from "../../../../Atomic/LoadingSpinner";
import { Button } from "react-bootstrap";
import { ChatGPT } from "../../../../../classes/ChatGPT";
import { LocalAudio } from "../../../../../classes/fileSystem/LocalAudio";
import { splitImageIntoTiles } from "./ImageSplitUtils";
import { combineVideosFromBlobs } from "../../../../../classes/Ffmpeg/FFmpegService";
import { mb_createVideoFromImageAndAudio } from "../../../../../classes/Ffmpeg/mediabunnyService";
import { AI } from "../../../../../classes/AiProviders/AI_Generic";
import { WorkflowTextModelSelect } from "../../../../../classes/AiProviders/AI_Generic_Components";

interface Props {
    shot: Shot;
}

const wf_name = "shot_previs_generate_audio"
const wf_loading = `${wf_name}/loading`
const wf_loading_audio = `${wf_name}/loading_audio`
const wf_name_audio = `${wf_name}_audio`


const component: React.FC<Props> = observer(({ shot }) => {
    const loading = shot.shotJson?.getField(wf_loading) ?? false;
    const loading_audio = shot.shotJson?.getField(wf_loading_audio) ?? false;


    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            console.log("Generate Staging Dscription");
                            Action_Previs_Generate_Shotlist(shot);
                        }} >
                        Generate Audio Text
                    </button>

                    {/* Model Selector */}
                    <WorkflowTextModelSelect workflowName={wf_name} />

                    <LoadingSpinner isLoading={loading} asButton />

                    <Button size="sm" variant="outline-success" onClick={() => { Action_Previs_generate_Audio(shot); }}                    >
                        Generate Audio
                    </Button>

                    <WorkflowOptionSelect
                        workflowName={wf_name_audio}
                        optionName={"voice"}
                        values={ChatGPT.options.audio_generation.voices}
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


                    <LoadingSpinner isLoading={loading_audio} asButton />

                    <Button size="sm" variant="outline-success" onClick={() => { Action_Previs_generate_AudioMultiline(shot); }}                    >
                        Generate Audio Multiline
                    </Button>
                </>
            }
            content={
                <>
                    {/* Model Selector */}


                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                </>
            }
        />
    </div >
})

/*
export async function Action_Previs_generate_AudioMultiline(shot: Shot) {

    if (!shot.first_frame) {
        console.log("No start Frame");
        return;
    }

    shot.shotJson?.updateField(wf_loading_audio, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name_audio];

        type AudioTextData = { texts: string[]; };

        const rawText: string = shot.shotJson?.data.previs_audiotext ?? "";
        const data: AudioTextData = JSON.parse(rawText);

        const lines = data.texts
        console.log(lines);

        const tiles = await splitImageIntoTiles(shot.first_frame, 4, 4);
        const imageBlobs = tiles.map(tile => tile.blob);

        const video_blobs = (await Promise.all(
            lines.map(async (line, index) => {
                const audio = await ChatGPT.generateAudio(
                    line + "\n",
                    workflow.voice ?? "coral",
                    workflow.model ?? "tts-1-hd",
                    undefined,
                    undefined,
                    Number(workflow.speed ?? "1.25"),
                );

                console.log("Audio Generated:", index);
                if (!audio) return;

                const imageBlob = imageBlobs[index % imageBlobs.length];
                const videoBlob = await mb_createVideoFromImageAndAudio(imageBlob, audio)

                return videoBlob;
            })
        )).filter((video): video is Blob => video != null);;

        const blob_final = await combineVideosFromBlobs(video_blobs);

        const url = URL.createObjectURL(blob_final);
        const a = document.createElement("a");
        a.href = url;
        a.download = "test.mp4";
        a.click();
        URL.revokeObjectURL(url);


    } finally {
        shot.shotJson?.updateField(wf_loading_audio, false);
    }
}
*/

export async function Action_Previs_generate_AudioMultiline(shot: Shot) {

    if (!shot.first_frame) {
        console.log("No start Frame");
        return;
    }

    shot.shotJson?.updateField(wf_loading_audio, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name_audio];

        type AudioTextData = { texts: string[] };

        const rawText: string = shot.shotJson?.data.previs_audiotext ?? "";
        const data: AudioTextData = JSON.parse(rawText);

        const lines = data.texts;

        console.log("Audio lines:", lines);

        // Split first frame into tiles.
        const tiles = await splitImageIntoTiles(shot.first_frame, 4, 4);
        const imageBlobs = tiles.map(tile => tile.blob);

        // Generate ALL audio files in parallel through the audio-pack endpoint.
        const audioBlobs = await ChatGPT.generateAudioPack(
            lines.map((line) => ({
                input: line + "\n",
                voice: workflow.voice ?? "coral",
                instructions: undefined,
                response_format: "mp3",
                speed: Number(workflow.speed ?? "1.25"),
            })),
            workflow.model ?? "tts-1-hd",
        );

        if (!audioBlobs) {
            console.log("Audio generation failed");
            return;
        }

        console.log("All audio generated:", audioBlobs.length);

        // Create videos in parallel.
        const video_blobs = (
            await Promise.all(
                audioBlobs.map(async (audio, index) => {
                    console.log("Creating video:", index);

                    const imageBlob =
                        imageBlobs[index % imageBlobs.length];

                    return await mb_createVideoFromImageAndAudio(
                        imageBlob,
                        audio
                    );
                })
            )
        ).filter(
            (video): video is Blob => video != null
        );

        const blob_final = await combineVideosFromBlobs(video_blobs);

        const url = URL.createObjectURL(blob_final);
        const a = document.createElement("a");

        a.href = url;
        a.download = "test.mp4";
        a.click();

        URL.revokeObjectURL(url);

    } finally {
        shot.shotJson?.updateField(wf_loading_audio, false);
    }
}


export async function Action_Previs_generate_Audio(shot: Shot) {
    shot.shotJson?.updateField(wf_loading_audio, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name_audio];

        const audio = await ChatGPT.generateAudio(
            shot.shotJson?.data.previs_audiotext,
            workflow.voice ?? "coral",
            workflow.model ?? "tts-1-hd",
            undefined,
            undefined,
            Number(workflow.speed ?? "1.25"),
        );

        console.log("Audio Generated");

        if (audio) {
            const local_audio = await LocalAudio.fromBlob(
                audio,
                shot.MediaFolder_results!,
                `gpt-audio-${Date.now()}.mp3`
            );

            return local_audio;
        }

    } finally {
        shot.shotJson?.updateField(wf_loading_audio, false);
    }
}

export async function Action_Previs_Generate_Shotlist(shot: Shot) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const prompt = `
            ${workflow.prompt ?? ""}  

            ${shot.shotJson?.data.previs_shots}
            `;

        const res = await AI.GenerateText({
            prompt,
            model: workflow.model,
        });

        await shot.shotJson!.updateField("previs_audiotext", res);

    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}

export const WF_Previs_GenerateAudio = {
    wf_name,
    wf_loading,
    component,
}






