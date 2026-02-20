// MediaGalleryPreview.tsx
import React from "react";
import type { LocalMedia } from "../../classes/interfaces/LocalMedia";
import { LocalImage } from "../../classes/LocalImage";
import MediaGalleryImage from "./MediaGalleryImage";
import { LocalVideo } from "../../classes/LocalVideo";
import MediaGalleryVideo from "./MediaGalleryVideo";
import { LocalAudio } from "../../classes/LocalAudio";
import MediaGalleryAudio from "./MediaGalleryAudio";
import { observer } from "mobx-react-lite";

interface MediaGalleryPreviewProps {
  mediaItem: LocalMedia;
  height?: number;
  onSelectMedia?: (media: LocalMedia) => void;
  topRightExtra?: React.ReactNode;
  isSelected?: boolean;
  isPicked?: boolean;
  label?: string;
  autoPlay? : boolean;
  showTags? :boolean;
}

const MediaGalleryPreview: React.FC<MediaGalleryPreviewProps> = observer(({
  mediaItem,
  height = 300,
  onSelectMedia,
  topRightExtra,
  isSelected = false,
  isPicked = false,
  label = "",
  autoPlay = true,
  showTags = true,
}) => {

  const renderBottomLabel = () =>
    label ? (
      <div className="position-absolute bottom-0 start-50 translate-middle-x bg-dark text-white px-2 py-1 rounded small text-nowrap opacity-75 pe-none mb-1">
        {label}
      </div>
    ) : null;

  const renderTags = () =>
    mediaItem.tags?.length && showTags ? (
      <div
        className="position-absolute bottom-0 start-50 translate-middle-x d-flex flex-wrap gap-1 justify-center mb-1"
        style={{ maxWidth: "90%" }}
      >
        {mediaItem.tags.map((tag, index) => (
          <div
            key={`${tag}-${index}`}
            className="bg-dark text-white px-2 py-1 rounded small text-nowrap opacity-75"
            style={{ cursor: "pointer" }}
            onClick={() => mediaItem.removeTag(tag)}
          >
            {tag}
          </div>
        ))}
      </div>
    ) : null;

  // ===== IMAGE =====
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
        {renderBottomLabel()}
        {renderTags()}
      </div>
    );
  }

  // ===== VIDEO =====
  if (mediaItem instanceof LocalVideo) {
    return (
      <div className="position-relative d-inline-block">
        <MediaGalleryVideo
          key={mediaItem.path}
          localVideo={mediaItem}
          height={height}
          onClick={() => onSelectMedia?.(mediaItem)}
          topRightExtra={topRightExtra}
          isSelected={isSelected}
          isPicked={isPicked}
          autoPlay={autoPlay}
        />
        {renderBottomLabel()}
        {renderTags()}
      </div>
    );
  }

  // ===== AUDIO =====
  if (mediaItem instanceof LocalAudio) {
    return (
      <div className="position-relative d-inline-block">
        <MediaGalleryAudio
          key={mediaItem.path}
          localAudio={mediaItem}
          height={height}
          onClick={() => onSelectMedia?.(mediaItem)}
          topRightExtra={topRightExtra}
          isSelected={isSelected}
          isPicked={isPicked}
        />
        {renderBottomLabel()}
        {renderTags()}
      </div>
    );
  }

  return null; // unsupported media types
});

export default MediaGalleryPreview;
