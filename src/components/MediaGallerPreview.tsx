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
  onSelectImage?: (image: LocalImage) => void;
  topRightExtra?: React.ReactNode; // now optional input
}

const MediaGalleryPreview: React.FC<MediaGalleryPreviewProps> = ({
  mediaItem,
  height = 300,
  onSelectImage,
  topRightExtra,
}) => {
  if (mediaItem instanceof LocalImage) {
    return (
      <MediaGalleryImage
        key={mediaItem.path}
        localImage={mediaItem}
        height={height}
        onClick={() => onSelectImage?.(mediaItem)}
        topRightExtra={topRightExtra}
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
      />
    );
  }

  return null; // fallback for unsupported media types
};

export default MediaGalleryPreview;