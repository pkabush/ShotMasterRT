// MediaFolderGallery.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import type { MediaFolder } from "../classes/MediaFolder";
import { LocalImage } from "../classes/LocalImage";
import MediaGallery from "./MediaGallery";
import SimpleButton from "./Atomic/SimpleButton";
import MediaGalleryPreview from "./MediaGallerPreview";
import DropArea from "./Atomic/DropArea";
import type { LocalMedia } from "../classes/interfaces/LocalMedia";
import ImageEditWindow from "./ImageEditWindow";
import { GoogleAI } from "../classes/GoogleAI";
import SimpleDropdown from "./Atomic/SimpleDropdown";
import { LocalVideo } from "../classes/LocalVideo";
import VideoEditWindow from "./VideoEditWindow";
import type { Shot } from "../classes/Shot";
import { ai_providers } from "../classes/AI_providers";

interface MediaFolderGalleryProps {
    mediaFolder: MediaFolder | null;
    label?: string;
    itemHeight?: number;
    showEditWindow?: boolean;
}

export const MediaFolderGallery: React.FC<MediaFolderGalleryProps> = observer(
    ({ mediaFolder, label = null, itemHeight = 300, showEditWindow = true }) => {
        if (!mediaFolder || !mediaFolder.folder) return null;
        label = label || mediaFolder.folderName;

        return (
            <>
                <MediaGallery label={label}
                    headerExtra={
                        <>
                            <SimpleButton label="Log" className="btn-outline-secondary btn-sm"
                                onClick={() => { mediaFolder.log(); }} />
                            <SimpleButton label="Import URL" className="btn-outline-secondary btn-sm"
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                                            console.log("Importing URL from clipboard:", text);
                                            mediaFolder.downloadFromUrl(text);
                                        } else {
                                            alert("Clipboard does not contain a valid URL.");
                                        }
                                    } catch (err) {
                                        console.error("Failed to read clipboard:", err);
                                        alert("Failed to access clipboard.");
                                    }
                                }} />
                            <SimpleButton label="Paste" className="btn-outline-secondary btn-sm"
                                onClick={() => { mediaFolder.copyFromClipboard(); }} />

                        </>

                    }
                    editWindow={
                        showEditWindow ? (
                            <     >
                                {/**IMAGE EDIT*/}
                                {
                                    mediaFolder.selectedMedia instanceof LocalImage ? (
                                        <ImageEditWindow
                                            localImage={mediaFolder.selectedMedia}
                                            reference_images={mediaFolder.getMediaWithTag("ref_frame") as LocalImage[]}
                                            onImageGenerated={async (result) => {
                                                console.log("Image generated:", result);
                                                const localImage: LocalImage | null = await GoogleAI.saveResultImage(result, mediaFolder.folder as FileSystemDirectoryHandle);
                                                if (localImage) mediaFolder.loadFile(localImage?.handle);
                                            }}
                                            onClose={() => mediaFolder.setSelectedMedia(null)}
                                        />
                                    ) : null
                                }
                                {/* VIDEO EDIT*/}
                                {
                                    mediaFolder.selectedMedia instanceof LocalVideo ? (
                                        <>
                                            <VideoEditWindow
                                                localVideo={mediaFolder.selectedMedia as LocalVideo} // must be LocalVideo
                                                initialText="Notes for this video"
                                                onVideoTaskCreated={async (task_info) => {
                                                    console.log("Video task created:", task_info);

                                                    const shot = mediaFolder.shot as Shot;
                                                    const task = shot.addTask(task_info.id, { provider: ai_providers.KLING, workflow: task_info.workflow })
                                                    await new Promise(res => setTimeout(res, 100));
                                                    console.log("created_task");

                                                    task.check_status();
                                                    /*
                                                    if (result?.url) {
                                                        try {
                                                            const savedVideo: LocalVideo = await LocalVideo.fromUrl(
                                                                result.url,
                                                                mediaFolder.folder as FileSystemDirectoryHandle
                                                            );
                                                            mediaFolder.loadFile(savedVideo.handle);
                                                        } catch (err) {
                                                            console.error("Failed to save generated video:", err);
                                                        }
                                                    }
                                                    */
                                                }}
                                                onClose={() => mediaFolder.setSelectedMedia(null)}
                                            />
                                        </>
                                    ) : null
                                }

                            </>) : null
                    }
                >
                    {mediaFolder.media.map((mediaItem) => (
                        <MediaGalleryPreview
                            key={mediaItem.path}
                            mediaItem={mediaItem}
                            height={itemHeight}
                            onSelectMedia={(media: LocalMedia) => { mediaFolder.setSelectedMedia(media) }}
                            isSelected={mediaItem.hasTag("start_frame")}
                            isPicked={mediaFolder.selectedMedia == mediaItem}
                            //label={mediaFolder.getMediaTags(mediaItem).join(",")}
                            topRightExtra={
                                <>
                                    <SimpleButton
                                        label="Delete"
                                        className="btn-outline-danger btn-sm"
                                        onClick={async () => {
                                            await mediaFolder.deleteMedia(mediaItem);
                                        }}
                                    />

                                    <SimpleButton
                                        label="LOG"
                                        className="btn-outline-secondary btn-sm"
                                        onClick={async () => {
                                            mediaItem.log();
                                        }}
                                    />


                                    <SimpleDropdown
                                        items={mediaFolder.tags}
                                        currentItem={"TAG"}
                                        onPicked={(val) => {
                                            //mediaFolder.setNamedMedia(val, mediaItem)
                                            mediaItem.toggleTag(val);
                                        }}
                                    />


                                </>
                            }
                        />
                    ))}

                    <DropArea width={100} height={itemHeight} onDrop={async (files) => { await mediaFolder.saveFiles(files); }}>
                    </DropArea>
                </MediaGallery>
            </>
        );
    }
);
