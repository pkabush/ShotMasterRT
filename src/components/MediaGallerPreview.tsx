// MediaGalleryPreview.tsx
import React from "react";
import type { LocalMedia } from "../classes/interfaces/LocalMedia";
import { LocalImage } from "../classes/LocalImage";
import MediaGalleryImage from "./MediaGalleryImage";
import { LocalVideo } from "../classes/LocalVideo";
import MediaGalleryVideo from "./MediaGalleryVideo";


interface MediaGalleryPreviewProps {
  mediaItem: LocalMedia;
  height?: number;
  onSelectMedia?: (image: LocalMedia) => void;
  topRightExtra?: React.ReactNode; // now optional input
  isSelected?: boolean; // <-- new
  isPicked?: boolean;
}

const MediaGalleryPreview: React.FC<MediaGalleryPreviewProps> = ({
  mediaItem,
  height = 300,
  onSelectMedia,
  topRightExtra,
  isSelected = false,
  isPicked = false,
}) => {
  if (mediaItem instanceof LocalImage) {
    return (
      <MediaGalleryImage
        key={mediaItem.path}
        localImage={mediaItem}
        height={height}
        onClick={() => onSelectMedia?.(mediaItem)}
        topRightExtra={topRightExtra}
        isSelected = {isSelected}
        isPicked = {isPicked}
      />
    );
  }

  if (mediaItem instanceof LocalVideo) {
    return (
      <MediaGalleryVideo
        key={mediaItem.path}
        localVideo={mediaItem}
        height={height}
        topRightExtra={topRightExtra}
        isSelected = {isSelected}
        isPicked = {isPicked}
        onClick={() => onSelectMedia?.(mediaItem)}
      />
    );
  }

  return null; // fallback for unsupported media types
};

export default MediaGalleryPreview;