import React from "react";

import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import MediaGalleryPreview from "./MediaGallerPreview";

interface MediaPreviewSmallProps {
  media: LocalMedia;
  previewHeight?: number;
  inlinePreviewHeight?: number;
  filenameVisibleChars?: number;
  hoverPosition?: "top" | "bottom";
  openOnClick?: boolean;
}

export const MediaPreviewSmall: React.FC<MediaPreviewSmallProps> = ({
  media,
  previewHeight = 300,
  inlinePreviewHeight = 25,
  hoverPosition = "bottom",
  openOnClick = true,
}) => {
  if (!media) return null;

  return (
    <div
      className="position-relative"
      style={{
        width: "100%",
        minWidth: 0,
      }}
      draggable={true}
      onDragStart={(e) => {
        console.log("DragStart");
        e.dataTransfer.setData("LocalFilePath", media.path);
      }}
    >
      <div
        className="d-flex align-items-center"
        style={{
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* Small inline preview */}
        <MediaGalleryPreview
          mediaItem={media}
          height={inlinePreviewHeight}
          autoPlay={false}
        />

        {/* Filename + hover preview */}
        <div
          className="position-relative media-filename-wrapper"
          style={{
            minWidth: 0,
            flex: "1 1 0%",
          }}
        >
          {/* Clickable text */}
          <span
            className="text-muted text-truncate d-block"
            style={{
              cursor: openOnClick ? "pointer" : "default",
            }}
            onClick={
              openOnClick ? () => media.openInNewTab() : undefined
            }
            title={media.name}
          >
            {media.name}
          </span>

          {/* Hover preview */}
          <div
            className="position-absolute d-none shadow border rounded bg-white media-hover-preview"
            style={{
              zIndex: 1050,
              left: 100,
              width: "max-content",
              ...(hoverPosition === "top"
                ? {
                  bottom: "100%",
                  top: "auto",
                }
                : {
                  top: "100%",
                  bottom: "auto",
                }),
            }}
          >
            <MediaGalleryPreview
              mediaItem={media}
              height={previewHeight}
            />
          </div>
        </div>
      </div>

      {/* Show hover preview */}
      <style>
        {`
        .media-filename-wrapper:hover > .media-hover-preview {
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
