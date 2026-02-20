import React from "react";

import type { LocalMedia } from "../../classes/interfaces/LocalMedia";
import MediaGalleryPreview from "./MediaGallerPreview";

interface MediaPreviewSmallProps {
  media: LocalMedia;
  previewHeight?: number;        // hover preview height
  inlinePreviewHeight?: number;  // small inline thumbnail
  filenameVisibleChars?: number; // number of chars to show at the end
  hoverPosition?: "top" | "bottom"; // position of hover preview
}

export const MediaPreviewSmall: React.FC<MediaPreviewSmallProps> = ({
  media,
  previewHeight = 300,
  inlinePreviewHeight = 25,
  filenameVisibleChars = 8,
  hoverPosition = "bottom",
}) => {
  if (!media) return null;

  const displayName = truncateFilename(media.name, filenameVisibleChars);

  // Set the hover preview position based on prop
  const hoverStyle: React.CSSProperties =
    hoverPosition === "top"
      ? { bottom: "100%", top: "auto" }
      : { top: "100%", bottom: "auto" };

  return (
    <div className="d-inline-block position-relative">
      <div className="d-flex align-items-center">
        {/* Small inline preview */}
        <MediaGalleryPreview
          mediaItem={media}
          height={inlinePreviewHeight}
          autoPlay = {false}
        />

        {/* Clickable text */}
        <span
          className="text-muted"
          style={{ cursor: "pointer" }}
          onClick={() => media.openInNewTab()}
          title={media.name} // full filename on hover
        >
          {displayName}
        </span>
      </div>

      {/* Hover preview */}
      <div
        className="position-absolute d-none shadow border rounded bg-white"
        style={{
          zIndex: 1050,
          left: "100%",
          width: "max-content",
          ...hoverStyle,
        }}
      >
        <MediaGalleryPreview mediaItem={media} height={previewHeight} />
      </div>

      {/* Show hover preview on hover */}
      <style>
        {`
          .d-inline-block.position-relative:hover > div.position-absolute {
            display: block !important;
          }
        `}
      </style>
    </div>
  );
};

// -----------------------
// Filename truncation helper
// -----------------------
export function truncateFilename(filename: string, visibleChars: number = 8): string {
  if (!filename) return "";
  if (filename.length <= visibleChars + 3) return filename; // short enough, no truncation

  const dotIndex = filename.lastIndexOf(".");
  const ext = dotIndex >= 0 ? filename.slice(dotIndex) : "";
  const namePart = dotIndex >= 0 ? filename.slice(0, dotIndex) : filename;

  const truncated = namePart.slice(-visibleChars); // last visibleChars
  return `...${truncated}${ext}`;
}
