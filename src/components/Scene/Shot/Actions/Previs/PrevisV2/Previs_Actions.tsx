import { audioRetime, combineVideosFromBlobs } from "../../../../../../classes/Ffmpeg/FFmpegService";
import { mb_createVideoFromImageAndAudio } from "../../../../../../classes/Ffmpeg/mediabunnyService";
import { LocalAudio } from "../../../../../../classes/fileSystem/LocalAudio";
import { LocalImage } from "../../../../../../classes/fileSystem/LocalImage";
import { LocalVideo } from "../../../../../../classes/fileSystem/LocalVideo";
import type { Shot } from "../../../../../../classes/Shot";
import { bakeTextOntoImage, combineImageBlobs, extractImageTile, resizeImageBlob } from "../ImageSplitUtils";



// Shots Order
export function Previs_GetShotsOrder(shot: Shot): any {
    const defaultOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const previsOrder = shot.shotJson?.getField("previs/previs_shot_order") ?? defaultOrder;
    return previsOrder;
}
/*
export function Previs_GetShotsOrdered(shot: Shot): any[] {
    const previsJson = Previs_GetShotsJson(shot);
    const shots = previsJson.shots ?? [];
    const order = Previs_GetShotsOrder(shot);

    return order
        .map((index: number) => shots[index])
        .filter((shot: any) => shot !== undefined);
}
*/
export function getShotDisplayIndex(
    shot: Shot,
    original_shot_index: number,
): number {
    const order = Previs_GetShotsOrder(shot);
    return order.indexOf(original_shot_index);
}
export function updatePrevisShotOrder(
    shot: Shot,
    original_shot_index: number,
    offset: number,
) {
    const order = [...Previs_GetShotsOrder(shot)];

    const preview_shot_index = getShotDisplayIndex(
        shot,
        original_shot_index,
    );

    if (preview_shot_index === -1 || offset === 0) {
        return;
    }

    const new_shot_index = preview_shot_index + offset;

    if (new_shot_index < 0 || new_shot_index >= order.length) {
        return;
    }

    // Move the shot to its new display position.
    const [shotIndex] = order.splice(preview_shot_index, 1);
    order.splice(new_shot_index, 0, shotIndex);

    // Save the updated order.
    shot.shotJson?.updateField("previs/previs_shot_order", order);
}



// CreateCombinedVideo
export const subtitles_path = "workflows/previs/add_subs"

export async function Action_Previs_combineAudioWithImages(
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
        const shots_order_indexes = Previs_GetShotsOrder(shot);

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
                //shots.map(async (shotData: any, index: number) => {
                shots_order_indexes.map(async (index: number) => {
                    const shotData = shots[index];
                    if (!shotData) return null;

                    console.log(`Processing previs shot ${index}...`);

                    try {
                        // -------------------------------------------------
                        // Extract the corresponding image tile.
                        // -------------------------------------------------

                        // Image
                        const image_path = shotData.image_path;
                        const playback_speed = Number(shotData.playback_speed ?? "1.0");
                        const shot_image = image_path ? shot.getByPath(shotData.image_path) as LocalImage : shot.first_frame;

                        if (!shot_image) {
                            console.error(
                                "No Image selected for shot."
                            );
                            return;
                        }

                        const storyboardIndex = shot_image.mediaJson?.getField("storyboard_index");
                        const is_extracted_tile = storyboardIndex !== null && storyboardIndex !== undefined;

                        const tile = is_extracted_tile ?
                            await extractImageTile(shot_image, 1, 1, 0)
                            :
                            await extractImageTile(shot_image, rows, columns, index)
                            ;

                        const use_subs = shot.scene.project.projinfo!.getField(subtitles_path);

                        const baked_text_blob = use_subs ?
                            await bakeTextOntoImage(tile.blob, shotData.audio_text?.trim())
                            :
                            tile.blob;


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
                            `${shot.previs_audio_folder!.path}/${audioName}`;

                        const audioFile =
                            shot.previs_audio_folder!.getByPath(
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

                        const fasterAudioBlob =
                            (playback_speed == 1.0) ?
                                audioBlob
                                :
                                await audioRetime(audioBlob, playback_speed);

                        // -------------------------------------------------
                        // Create video from image + existing audio.
                        // -------------------------------------------------

                        console.log(
                            `Creating video for shot ${index}...`
                        );

                        const video =
                            await mb_createVideoFromImageAndAudio(
                                //tile.blob,
                                baked_text_blob,
                                fasterAudioBlob
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
        // Create Video.
        // ---------------------------------------------------------

        return await LocalVideo.fromBlob(blob_final, shot.MediaFolder_genVideo!, `previs_v${shot.MediaFolder_genVideo?.children.length}.mp4`);

    } finally {
        console.log("Video_Generated");
    }
}

export function getPrevisShotByIndex(
    shot: Shot,
    index: number,
): any | undefined {
    const previsJson = shot.shotJson?.getField("previs_json");
    if (!previsJson) { return undefined; }
    try {
        const shotsJson = JSON.parse(previsJson);
        return shotsJson?.shots?.[index];
    } catch (error) {
        console.error("Failed to parse previs_json:", error);
        return undefined;
    }
}

export function updatePrevisShot(
    shot: Shot,
    index: number,
    field: string,
    value: any,
) {
    const previsJson = shot.shotJson?.getField("previs_json");

    if (!previsJson) {
        return;
    }

    try {
        const shotsJson = JSON.parse(previsJson);

        if (!shotsJson?.shots?.[index]) {
            return;
        }

        shotsJson.shots[index][field] = value;

        shot.shotJson?.updateField(
            "previs_json",
            JSON.stringify(shotsJson, null, 2),
        );
    } catch (error) {
        console.error("Failed to update previs_json:", error);
    }
}

export function Previs_GetShotsJson(shot: Shot): any {
    const defaultJson = {
        shots: Array.from({ length: 16 }, () => ({})),
    };

    const previsJson = shot.shotJson?.getField("previs_json");

    if (!previsJson) {
        return defaultJson;
    }

    try {
        const shotsJson = JSON.parse(previsJson);

        if (!shotsJson || !Array.isArray(shotsJson.shots)) {
            return defaultJson;
        }

        return shotsJson;
    } catch (error) {
        console.error("Failed to parse previs_json:", error);
        return defaultJson;
    }
}

export function updatePrevisVoice(
    shot: Shot,
    speaker: string,
    voice: string,
) {
    const previsJson = shot.shotJson?.getField("previs_json");

    if (!previsJson) {
        return;
    }

    try {
        const previsJsonData = JSON.parse(previsJson);

        if (!previsJsonData.voices) {
            previsJsonData.voices = {};
        }

        previsJsonData.voices[speaker] = voice;

        shot.shotJson?.updateField(
            "previs_json",
            JSON.stringify(previsJsonData, null, 2),
        );
    } catch (error) {
        console.error("Failed to update previs voice:", error);
    }
}

export async function Action_Previs_CombineStoryboard(shot: Shot) {
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
        const shots_order_indexes = Previs_GetShotsOrder(shot);

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

        const image_blobs = (
            await Promise.all(
                //shots.map(async (shotData: any, index: number) => {
                shots_order_indexes.map(async (index: number) => {
                    const shotData = shots[index];
                    if (!shotData) return null;

                    console.log(`Processing previs shot ${index}...`);

                    try {
                        // -------------------------------------------------
                        // Extract the corresponding image tile.
                        // -------------------------------------------------

                        // Image
                        const image_path = shotData.image_path;
                        const shot_image = image_path ? shot.getByPath(shotData.image_path) as LocalImage : shot.first_frame;

                        if (!shot_image) {
                            console.error("No Image selected for shot.");
                            return;
                        }

                        const storyboardIndex = shot_image.mediaJson?.getField("storyboard_index");
                        const is_extracted_tile = storyboardIndex !== null && storyboardIndex !== undefined;

                        const tile = is_extracted_tile ?
                            await extractImageTile(shot_image, 1, 1, 0)
                            :
                            await extractImageTile(shot_image, rows, columns, index)
                            ;

                        return tile.blob;

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

        console.log("Image Blobs", image_blobs);

        const combined = await combineImageBlobs(image_blobs);

        const resizes = await resizeImageBlob(combined.blob, 1440); //1440,1152
        //downloadImageFomUrl(resizes.url);

        //Extract Image
        const extracted_image = await LocalImage.fromBlob(resizes.blob, shot.MediaFolder_results!, `combined_image_v${shot.MediaFolder_results.children.length}.png`);

        //extracted_image.setTags(["start_frame"]);

        return extracted_image;

    } finally {
        console.log("Video_Generated");
    }
}

export function Action_Previs_ApplyOrder(shot: Shot) {
    const previsJson = shot.shotJson?.getField("previs_json");

    if (!previsJson) {
        console.warn("No previs_json found.");
        return;
    }

    try {
        const shotsJson = JSON.parse(previsJson);
        const shots = shotsJson?.shots;

        if (!Array.isArray(shots)) {
            console.warn("previs_json does not contain a shots array.");
            return;
        }

        const order = Previs_GetShotsOrder(shot);

        if (!Array.isArray(order)) {
            console.warn("Invalid previs shot order.");
            return;
        }

        const validOrder = order.filter(
            (index: number) =>
                Number.isInteger(index) &&
                index >= 0 &&
                index < shots.length
        );

        const includedIndices = new Set(validOrder);

        const reorderedShots = validOrder.map(
            (index: number) => shots[index]
        );

        // Append shots missing from the order.
        shots.forEach((shotData: any, index: number) => {
            if (!includedIndices.has(index)) {
                reorderedShots.push(shotData);
            }
        });

        shotsJson.shots = reorderedShots;

        shot.shotJson?.updateField(
            "previs_json",
            JSON.stringify(shotsJson, null, 2)
        );

        // Reset display order after applying it.
        shot.shotJson?.updateField(
            "previs/previs_shot_order",
            reorderedShots.map((_, index) => index)
        );

        console.log("Previs shot order applied successfully.");
    } catch (error) {
        console.error("Failed to apply previs shot order:", error);
    }
}

export function Action_Previs_ClearImagePaths(shot: Shot) {
    const previsJson = shot.shotJson?.getField("previs_json");

    if (!previsJson) {
        console.warn("No previs_json found.");
        return;
    }

    try {
        const shotsJson = JSON.parse(previsJson);
        const shots = shotsJson?.shots;

        if (!Array.isArray(shots)) {
            console.warn("previs_json does not contain a shots array.");
            return;
        }

        shots.forEach((shotData: any) => {
            if (shotData && typeof shotData === "object") {
                delete shotData.image_path;
            }
        });

        shot.shotJson?.updateField(
            "previs_json",
            JSON.stringify(shotsJson, null, 2)
        );

        console.log("Previs image paths cleared successfully.");
    } catch (error) {
        console.error("Failed to clear previs image paths:", error);
    }
}

export async function Action_Previs_ExtractAndFinalizeStoryboard(shot: Shot) {
    const image = await Action_Previs_CombineStoryboard(shot);
    if(image) image.setTags(["start_frame"]);
    Action_Previs_ApplyOrder(shot);
    Action_Previs_ClearImagePaths(shot);
}