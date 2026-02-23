// MediaFolderGallery.tsx
import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import type { MediaFolder } from "../classes/MediaFolder";
import { LocalImage } from "../classes/fileSystem/LocalImage";
import MediaGallery from "./MediaGallery";
import SimpleButton from "./Atomic/SimpleButton";
import MediaGalleryPreview from "./MediaComponents/MediaGallerPreview";
import DropArea from "./Atomic/DropArea";
import type { LocalMedia } from "../classes/fileSystem/LocalMedia";
import ImageEditWindow from "./ImageEditWindow";
import SimpleDropdown from "./Atomic/SimpleDropdown";
import { LocalVideo } from "../classes/fileSystem/LocalVideo";
import VideoEditWindow from "./VideoEditWindow";
import type { Shot } from "../classes/Shot";
import { ai_providers } from "../classes/AI_providers";
import GrayscaleOverlay from "./Atomic/MediaElements/GrayscaleOverlay";
import AddOutline from "./Atomic/MediaElements/AddOutline";
import MediaItemTags from "./Atomic/MediaElements/MediaItemTags";
import HoverContainer from "./MediaComponents/HoverContainer";
import TopRightExtra from "./Atomic/MediaElements/TopRightExtra";
import SimpleToggle from "./SimpleToggle";

interface MediaFolderGalleryProps {
    mediaFolder: MediaFolder | null;
    label?: string;
    itemHeight?: number;
    showEditWindow?: boolean;
}

export const MediaFolderGallery: React.FC<MediaFolderGalleryProps> = observer(
    ({ mediaFolder, label = null, itemHeight = 300, showEditWindow = true }) => {
        const [highlightGenParents, setHighlightGenParents] = useState<boolean>(true);


        if (!mediaFolder || !mediaFolder.handle) return null;
        label = label || mediaFolder.name;

        return (
            <>
                <MediaGallery label={label}
                    headerExtra={
                        <>
                            <SimpleToggle label={"Highlight Gen Relations"} value={highlightGenParents} onToggle={(e) => { setHighlightGenParents(e) }} />
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
                                                    const task = shot.addTask(task_info.id, { provider: ai_providers.KLING, workflow: task_info.workflow, geninfo: task_info.geninfo })
                                                    await new Promise(res => setTimeout(res, 100));
                                                    console.log("created_task");

                                                    task.check_status();
                                                }}
                                                onClose={() => mediaFolder.setSelectedMedia(null)}
                                            />
                                        </>
                                    ) : null
                                }

                            </>) : null
                    }
                >
                    {mediaFolder.mediaOrdered.map((mediaItem) => (

                        <HoverContainer key={mediaItem.path}
                            hoverElements={
                                <>
                                    <TopRightExtra>
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
                                                mediaItem.toggleTag(val);
                                            }}
                                        />
                                    </TopRightExtra>
                                </>
                            }>
                            <MediaGalleryPreview
                                mediaItem={mediaItem}
                                height={itemHeight}
                                onSelectMedia={(media: LocalMedia) => { mediaFolder.setSelectedMedia(media) }}
                            >
                                {mediaFolder.selectedMedia != null && (
                                    mediaFolder.selectedMedia !== mediaItem &&
                                    mediaFolder.selectedMedia?.sourceImage !== mediaItem &&
                                    !mediaFolder.selectedMedia?.generatedMedia.includes(mediaItem)
                                ) && highlightGenParents && (<GrayscaleOverlay />)}

                                <AddOutline showOutline={mediaFolder.selectedMedia == mediaItem} color="#0a74ff" width={5} />
                                <AddOutline showOutline={mediaFolder.selectedMedia?.sourceImage == mediaItem} color="#ff0ab565" width={5} />
                                <AddOutline showOutline={mediaFolder.selectedMedia?.generatedMedia.includes(mediaItem)} color="#fffb0a65" width={5} />

                                <MediaItemTags mediaItem={mediaItem} />
                            </MediaGalleryPreview>
                        </HoverContainer>
                    ))}

                    <DropArea width={100} height={itemHeight} onDrop={async (files) => { await mediaFolder.saveFiles(files); }}>
                    </DropArea>
                </MediaGallery>
            </>
        );
    }
);
