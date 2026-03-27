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
import { LocalVideo } from "../classes/fileSystem/LocalVideo";
import VideoEditWindow from "./VideoEditWindow";
import type { Shot } from "../classes/Shot";
import { ai_providers } from "../classes/AI_provider";
import GrayscaleOverlay from "./Atomic/MediaElements/GrayscaleOverlay";
import AddOutline from "./Atomic/MediaElements/AddOutline";
import MediaItemTags from "./Atomic/MediaElements/MediaItemTags";
import SimpleToggle from "./SimpleToggle";
import { Form, Stack } from "react-bootstrap";
import * as ContextMenu from "@radix-ui/react-context-menu";
import "../css/ContextMenu.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faClipboard, faTags, faTrashCan } from "@fortawesome/free-solid-svg-icons";

interface MediaFolderGalleryProps {
    mediaFolder: MediaFolder | null;
    label?: string;
    itemHeight?: number;
    showEditWindow?: boolean;
}

export const MediaFolderGallery: React.FC<MediaFolderGalleryProps> = observer(
    ({ mediaFolder, label = null, itemHeight = 300, showEditWindow = true }) => {
        const [highlightGenParents, setHighlightGenParents] = useState<boolean>(true);
        const [currentItemHeight, setCurrentItemHeight] = useState<number>(itemHeight);

        if (!mediaFolder || !mediaFolder.handle) return null;
        label = label || mediaFolder.name;

        return (
            <>
                <MediaGallery label={label}
                    headerExtra={
                        <>
                            <Stack direction="horizontal">

                                <Form.Select
                                    size="sm"
                                    style={{ width: 100 }}
                                    value={currentItemHeight}
                                    onChange={(e) => setCurrentItemHeight(Number(e.target.value))}
                                >
                                    <option value={50}>Tiny</option>
                                    <option value={150}>Small</option>
                                    <option value={250}>Medium</option>
                                    <option value={350}>Large</option>
                                    <option value={500}>XL</option>
                                </Form.Select>


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
                                {true &&
                                    <SimpleButton label="Paste" className="btn-outline-secondary btn-sm"
                                        onClick={() => { mediaFolder!.copyFromClipboard(); }} />}
                            </Stack>

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
                                                onVideoTaskCreated={async (task_info) => {
                                                    console.log("Video task created:", task_info);

                                                    const shot = mediaFolder.shot as Shot;
                                                    const task = shot.addTask(task_info.id, { provider: ai_providers.KLING, workflow: task_info.workflow, geninfo: task_info.geninfo })
                                                    await new Promise(res => setTimeout(res, 100));
                                                    console.log("created_task");

                                                    task.check_status();
                                                }}
                                                onClose={() => mediaFolder.setSelectedMedia(null)}
                                                reference_images={(mediaFolder.parentFolder as Shot).MediaFolder_results!.getMediaWithTag("ref_frame") as LocalImage[]}
                                            />
                                        </>
                                    ) : null
                                }

                            </>) : null
                    }
                >
                    <ContextMenu.Root>
                        <ContextMenu.Trigger style={{ backgroundColor: "#2c2c31", }} className="d-flex flex-wrap gap-2 w-100 h-100" >
                            {mediaFolder.mediaOrdered.map((mediaItem) => (

                                <ContextMenu.Root key={mediaItem.path}>
                                    <ContextMenu.Trigger>
                                        <MediaGalleryPreview
                                            mediaItem={mediaItem}
                                            height={currentItemHeight}
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
                                    </ContextMenu.Trigger>

                                    <ContextMenu.Portal>
                                        <ContextMenu.Content className="ContextMenuContent">
                                            <ContextMenu.Sub>
                                                <ContextMenu.SubTrigger className="ContextMenuSubTrigger">
                                                    <MenuItemIcon><FontAwesomeIcon icon={faTags} /></MenuItemIcon>
                                                    Tags
                                                    <div className="RightSlot">
                                                        <FontAwesomeIcon icon={faChevronRight} />
                                                    </div>
                                                </ContextMenu.SubTrigger>
                                                <ContextMenu.Portal>
                                                    <ContextMenu.SubContent
                                                        className="ContextMenuSubContent"
                                                        sideOffset={2}
                                                        alignOffset={-5}
                                                    >
                                                        {mediaFolder.tags.map((tag) => {
                                                            return <ContextMenu.Item className="ContextMenuItem" key={tag} onClick={(event) => {
                                                                event.preventDefault();
                                                                mediaItem.toggleTag(tag);
                                                            }}>
                                                                <MenuItemIcon>
                                                                    <div
                                                                        className={`rounded-circle mx-1 ${mediaItem.hasTag(tag) ? 'bg-success' : 'border border-secondary'}`}
                                                                        style={{ width: '15px', height: '15px' }}
                                                                    />
                                                                </MenuItemIcon>

                                                                {tag}
                                                            </ContextMenu.Item>

                                                        })}

                                                    </ContextMenu.SubContent>
                                                </ContextMenu.Portal>
                                            </ContextMenu.Sub>

                                            <ContextMenu.Separator className="ContextMenuSeparator" />

                                            <ContextMenu.Item className="ContextMenuItem" onClick={() => mediaItem.log()}>
                                                <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                                Log
                                            </ContextMenu.Item>

                                            <ContextMenu.Item className="ContextMenuItem" onClick={async () => { await mediaItem.copyToClipboard() }}>
                                                <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                                Copy
                                            </ContextMenu.Item>

                                            <ContextMenu.Item className="ContextMenuItem" onClick={() => mediaItem.openInNewTab()}>
                                                <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                                Open in new Tab
                                            </ContextMenu.Item>

                                            <ContextMenu.Item className="ContextMenuItem danger" onClick={() => { mediaItem.delete() }}>
                                                <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
                                                Delete
                                            </ContextMenu.Item>


                                        </ContextMenu.Content>
                                    </ContextMenu.Portal>



                                </ContextMenu.Root>




                            ))}

                            <DropArea width={100} height={currentItemHeight} onDropFiles={async (files) => { await mediaFolder.saveFiles(files); }}>
                            </DropArea>
                        </ContextMenu.Trigger>

                        <ContextMenu.Portal>
                            <ContextMenu.Content className="ContextMenuContent">

                                <ContextMenu.Item className="ContextMenuItem" onClick={() => mediaFolder.copyFromClipboard()}>
                                    <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                    Paste
                                </ContextMenu.Item>


                                <ContextMenu.Item className="ContextMenuItem" onClick={() => mediaFolder.log()}>
                                    <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                    Log
                                </ContextMenu.Item>





                            </ContextMenu.Content>
                        </ContextMenu.Portal>




                    </ContextMenu.Root>
                </MediaGallery>
            </>
        );
    }
);



interface MenuItemIconProps {
    children: React.ReactNode;
}

export const MenuItemIcon: React.FC<MenuItemIconProps> = ({ children }) => {
    return (
        <span
            className="ContextMenuItemIndicator"
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {children}
        </span>
    );
};