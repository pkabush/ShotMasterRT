import React from "react";
import { Button } from "react-bootstrap";
import type { Shot } from "../../../../../../classes/Shot";
import { ChatGPT } from "../../../../../../classes/ChatGPT";
import { LocalAudio } from "../../../../../../classes/fileSystem/LocalAudio";
import SettingsButton from "../../../../../Atomic/SettingsButton";
import LoadingSpinner from "../../../../../Atomic/LoadingSpinner";
import SimpleSelect from "../../../../../Atomic/SimpleSelect";
import { WorkflowOptionSelect } from "../../../../../WorkflowOptionSelect";
import { getPrevisShotByIndex, updatePrevisShot } from "./PrevisShotsJsonPreview";

const wf_name = "shot_previs_generate_audio";
const wf_name_audio = `${wf_name}_audio`;

interface Props {
    shot: Shot;
    audioIndex: number;
}

const Previs_GenerateAudioGPT: React.FC<Props> = ({
    shot,
    audioIndex,
}) => {
    const shotData = getPrevisShotByIndex(shot, audioIndex);

    if (!shotData) { return null; }

    const audioText = shotData.audio_text ?? "";
    const audioVoice = shotData.audio_voice ?? "nova";
    const audioName = `audio_shot_${audioIndex}.mp3`;

    const handleVoiceChange = (value: string) => {
        updatePrevisShot(shot, audioIndex, "audio_voice", value,);
    };

    const handleGenerateAudio = async () => {
        console.log("GENERATE AUDIO", audioText);
        const workflow = shot.scene.project.workflows[wf_name_audio];

        if (!workflow) {
            console.error(`Workflow not found: ${wf_name_audio}`);
            return;
        }

        const audio = await ChatGPT.generateAudio(
            audioText,
            audioVoice,
            workflow.model ?? "tts-1-hd",
            undefined,
            undefined,
            Number(workflow.speed ?? "1.25"),
        );

        console.log("Audio Generated");

        if (audio) {
            await LocalAudio.fromBlob(
                audio,
                shot.MediaFolder_results!,
                audioName,
            );
        }
    };

    return (
        <SettingsButton
            className="mb-2 mt-2"
            buttons={
                <>
                    <Button
                        size="sm"
                        variant="outline-success"
                        onClick={handleGenerateAudio}
                    >
                        Generate Audio GPT
                    </Button>

                    <SimpleSelect
                        options={ChatGPT.options.audio_generation.voices}
                        value={audioVoice}
                        onChange={handleVoiceChange}
                    />

                    <WorkflowOptionSelect
                        workflowName={wf_name_audio}
                        optionName="model"
                        values={ChatGPT.options.audio_generation.models}
                    />

                    <WorkflowOptionSelect
                        workflowName={wf_name_audio}
                        optionName="speed"
                        values={ChatGPT.options.audio_generation.speed}
                        defaultValue="1.25"
                    />

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

export default Previs_GenerateAudioGPT;