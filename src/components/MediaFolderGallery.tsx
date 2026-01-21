// MediaFolderGallery.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import type { MediaFolder } from "../classes/MediaFolder";
import { LocalImage } from "../classes/LocalImage";
import MediaGallery from "./MediaGallery";
import SimpleButton from "./Atomic/SimpleButton";
import MediaGalleryPreview from "./MediaGallerPreview";

interface MediaFolderGalleryProps {
    mediaFolder: MediaFolder | null;
    label?: string;
    itemHeight?: number;
    onSelectImage?: (image: LocalImage) => void;
}

export const MediaFolderGallery: React.FC<MediaFolderGalleryProps> = observer(
    ({ mediaFolder, label = "Media", itemHeight = 300, onSelectImage }) => {
        if (!mediaFolder || !mediaFolder.folder) return null;

        return (
            <MediaGallery label={label}
                headerExtra={
                    <SimpleButton label="Log" className="btn-outline-secondary btn-sm"
                        onClick={() => { mediaFolder.log(); }} />
                }>
                {mediaFolder.media.map((mediaItem) => (
                    <MediaGalleryPreview
                        key={mediaItem.path}
                        mediaItem={mediaItem}
                        height={itemHeight}
                        onSelectImage={onSelectImage}
                        topRightExtra={
                            <>
                                <SimpleButton
                                    label="Pick"
                                    className="btn-outline-secondary btn-sm"
                                    onClick={() => {
                                        mediaFolder.setPickedMedia(mediaItem);
                                    }}
                                />
                                <SimpleButton
                                    label="Delete"
                                    className="btn-outline-danger btn-sm"
                                    onClick={async () => {
                                        await mediaFolder.deleteMedia(mediaItem);
                                    }}
                                />
                            </>
                        }
                    />
                ))}
            </MediaGallery>

        );
    }
);
