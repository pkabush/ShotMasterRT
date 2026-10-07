import type { Shot } from "../../../../../../classes/Shot";
import { Previs_GetShotsJson } from "./PrevisShotsJsonPreview";

type DialogueLine = {
    speaker: string;
    text: string;
    voice: string;
    style: string;
};

export function Previs_parseDialogue(
    input: string,
    defaultSpeaker = "Narrator",
    defaultVoice = "Kore"
): DialogueLine[] {

    const result: DialogueLine[] = [];
    let position = 0;

    while (position < input.length) {
        const openBracket = input.indexOf("[", position);

        // No more metadata blocks.
        // Everything remaining is default dialogue.
        if (openBracket === -1) {
            const text = input.slice(position).trim();

            if (text) {
                result.push({
                    speaker: defaultSpeaker,
                    text,
                    voice: defaultVoice,
                    style: ""
                });
            }

            break;
        }

        // Text before [...]
        const textBefore = input
            .slice(position, openBracket)
            .trim();

        if (textBefore) {
            result.push({
                speaker: defaultSpeaker,
                text: textBefore,
                voice: defaultVoice,
                style: ""
            });
        }

        // Find closing ]
        const closeBracket = input.indexOf("]", openBracket);

        // Malformed [...]
        if (closeBracket === -1) {
            const text = input.slice(openBracket).trim();

            if (text) {
                result.push({
                    speaker: defaultSpeaker,
                    text,
                    voice: defaultVoice,
                    style: ""
                });
            }

            break;
        }

        // Content inside [...]
        const metadata = input
            .slice(openBracket + 1, closeBracket)
            .trim();

        // IMPORTANT:
        // Don't filter empty values!
        const parts = metadata.split(",").map(x => x.trim());

        const speaker = parts[0] || defaultSpeaker;
        const voice = parts[0] || defaultVoice;
        const style = parts[1] || "";

        // Find next [...]
        const nextOpenBracket = input.indexOf("[", closeBracket + 1);

        const textEnd =
            nextOpenBracket === -1
                ? input.length
                : nextOpenBracket;

        const text = input
            .slice(closeBracket + 1, textEnd)
            .trim();

        if (text) {
            result.push({
                speaker,
                text,
                voice,
                style
            });
        }

        position = textEnd;
    }

    return result;
}

export function Previs_getAllDialogueSpeakers(
    shot: Shot,
): string[] {
    const speakers = new Set<string>();

    const previsJson = Previs_GetShotsJson(shot);

    if (!previsJson?.shots) {
        return [];
    }

    previsJson.shots.forEach((shotData:any) => {                

        const audioText = shotData.audio_text ?? "";

        if (!audioText.trim()) {
            return;
        }

        const dialogue = Previs_parseDialogue(
            audioText,
        );

        dialogue.forEach((line) => {
            speakers.add(line.speaker);
        });
    });

    return Array.from(speakers);
}

export function Previs_applyVoiceMap(
    dialogue: DialogueLine[],
    voiceMap: Record<string, string>,
    defaultVoice = "Kore",
): DialogueLine[] {
    return dialogue.map((line) => ({
        ...line,
        voice: voiceMap[line.speaker] ?? defaultVoice,
    }));
}