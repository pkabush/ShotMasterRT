// MediaGalleryPreview.tsx
import React from "react";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import { LocalImage } from "../../classes/fileSystem/LocalImage";
import MediaGalleryImage from "./MediaGalleryImage";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import MediaGalleryVideo from "./MediaGalleryVideo";
import { LocalAudio } from "../../classes/fileSystem/LocalAudio";
import MediaGalleryAudio from "./MediaGalleryAudio";
import { observer } from "mobx-react-lite";

interface MediaGalleryPreviewProps {
  mediaItem: LocalMedia;
  height?: number;
  onSelectMedia?: (media: LocalMedia) => void;
  autoPlay?: boolean;
  children?: React.ReactNode;
}

const MediaGalleryPreview: React.FC<MediaGalleryPreviewProps> = observer(({
  mediaItem,
  height = 300,
  onSelectMedia,
  autoPlay = true,
  children = [],
}) => {

  // ===== IMAGE =====
  if (mediaItem instanceof LocalImage) {
    return (
      <div className="position-relative d-inline-block">
        <MediaGalleryImage
          key={mediaItem.path}
          localImage={mediaItem}
          height={height}
          onClick={() => onSelectMedia?.(mediaItem)}
        />
        {children}
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
          autoPlay={autoPlay}
        />        
        {children}
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
        />
        {children}
      </div>
    );
  }

  return null; // unsupported media types
});

export default MediaGalleryPreview;
