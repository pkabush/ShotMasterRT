
import { observer } from "mobx-react-lite";
import type { LocalFolder } from "../../../classes/fileSystem/LocalFolder";
import { Shot } from "../../../classes/Shot";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { MediaFolder } from "../../../classes/MediaFolder";
import { MenuItemIcon } from "../../MediaFolderGallery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faClipboard,
    faDownload,
    faPhotoFilm,
    faTags,
    faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import { useLocalMedia } from "./LocalMediaContext";

interface MediaContextMenuProps {
    children: React.ReactNode;
    showDelete?: boolean;
    showTags?: boolean;
}

export const MediaContextMenu: React.FC<MediaContextMenuProps> = observer(({
    children,
    showDelete = true,
    showTags = true
}) => {

    const { mediaItem } = useLocalMedia();
    const mediaFolder = mediaItem.parentFolder as LocalFolder;

    const shot = mediaFolder.parentFolder instanceof Shot
        ? mediaFolder.parentFolder as Shot
        : undefined;

    return (
        <ContextMenu.Root key={mediaItem.path}>
            <ContextMenu.Trigger asChild={false} className="media-context-trigger">
                {children}
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content className="ContextMenuContent">

                    {/* TAGS */}
                    {showTags && mediaFolder instanceof MediaFolder && (
                        <>
                            <ContextMenu.Sub>
                                <ContextMenu.SubTrigger className="ContextMenuSubTrigger">
                                    <MenuItemIcon>
                                        <FontAwesomeIcon icon={faTags} />
                                    </MenuItemIcon>
                                    Tags
                                    <div className="RightSlot">
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </div>
                                </ContextMenu.SubTrigger>

                                <ContextMenu.Portal>
                                    <ContextMenu.SubContent className="ContextMenuSubContent">
                                        {mediaFolder.tags.map(tag => (
                                            <ContextMenu.Item
                                                key={tag}
                                                className="ContextMenuItem"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    mediaItem.toggleTag(tag);
                                                }}
                                            >
                                                <MenuItemIcon>
                                                    <div
                                                        className={`rounded-circle mx-1 ${
                                                            mediaItem.hasTag(tag)
                                                                ? "bg-success"
                                                                : "border border-secondary"
                                                        }`}
                                                        style={{
                                                            width: 15,
                                                            height: 15
                                                        }}
                                                    />
                                                </MenuItemIcon>
                                                {tag}
                                            </ContextMenu.Item>
                                        ))}
                                    </ContextMenu.SubContent>
                                </ContextMenu.Portal>
                            </ContextMenu.Sub>

                            <ContextMenu.Separator className="ContextMenuSeparator" />
                        </>
                    )}

                    {/* EXISTING MENU ITEMS */}
                    <ContextMenu.Item
                        onClick={() => mediaItem.log()}
                        className="ContextMenuItem"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Log
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={() => mediaItem.copyToClipboard()}
                        className="ContextMenuItem"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Copy
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={() => mediaItem.download()}
                        className="ContextMenuItem warning"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faDownload} />
                        </MenuItemIcon>
                        Download
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={() => mediaItem.openInNewTab()}
                        className="ContextMenuItem"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Open in new Tab
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={async () => {
                            console.log(await mediaItem.uploadToR2());
                        }}
                        className="ContextMenuItem warning"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Upload To R2
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={async () => {
                            await mediaItem.uploadToByteplus();
                        }}
                        className="ContextMenuItem warning"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Upload To Bytedance
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={async () => {
                            console.log(
                                "status",
                                await mediaItem.getByteplusAssetStatus()
                            );
                        }}
                        className="ContextMenuItem warning"
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Check BP Status
                    </ContextMenu.Item>

                    {shot && (
                        <ContextMenu.Item
                            className="ContextMenuItem warning"
                            onClick={() => shot.references?.addTag(mediaItem)}
                        >
                            <MenuItemIcon>
                                <FontAwesomeIcon icon={faPhotoFilm} />
                            </MenuItemIcon>
                            Add Shot Reference
                        </ContextMenu.Item>
                    )}

                    {/* DELETE */}
                    {showDelete && (
                        <ContextMenu.Item
                            className="ContextMenuItem danger"
                            onClick={() => mediaItem.delete()}
                        >
                            <MenuItemIcon>
                                <FontAwesomeIcon icon={faTrashCan} />
                            </MenuItemIcon>
                            Delete
                        </ContextMenu.Item>
                    )}

                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
});
