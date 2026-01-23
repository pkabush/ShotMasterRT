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
  label?: string;
}

const MediaGalleryPreview: React.FC<MediaGalleryPreviewProps> = ({
  mediaItem,
  height = 300,
  onSelectMedia,
  topRightExtra,
  isSelected = false,
  isPicked = false,
  label = "",
}) => {
  if (mediaItem instanceof LocalImage) {
    return (
      <div className="position-relative d-inline-block">
        <MediaGalleryImage
          key={mediaItem.path}
          localImage={mediaItem}
          height={height}
          onClick={() => onSelectMedia?.(mediaItem)}
          topRightExtra={topRightExtra}
          isSelected={isSelected}
          isPicked={isPicked}
        />

        {/**BOTTOM LABEL */}
        {label &&
          <div className="position-absolute bottom-0 start-50 translate-middle-x bg-dark text-white px-2 py-1 rounded small text-nowrap opacity-75 pe-none mb-1"        >
            {label}
          </div>}

      </div>
    );
  }

  if (mediaItem instanceof LocalVideo) {
    return (
      <MediaGalleryVideo
        key={mediaItem.path}
        localVideo={mediaItem}
        height={height}
        topRightExtra={topRightExtra}
        isSelected={isSelected}
        isPicked={isPicked}
        onClick={() => onSelectMedia?.(mediaItem)}
      />
    );
  }

  return null; // fallback for unsupported media types
};

export default MediaGalleryPreview;