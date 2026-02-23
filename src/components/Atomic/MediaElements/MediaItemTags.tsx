// MediaTimeTags.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import type { LocalMedia } from "../../../classes/fileSystem/LocalMedia";


interface MediaItemTagsProps {
  mediaItem: LocalMedia;
  className?: string;
  style?: React.CSSProperties;
}

const MediaItemTags: React.FC<MediaItemTagsProps> = observer(
  ({ mediaItem, className, style }) => {
    if (!mediaItem.tags?.length) return null;

    return (
      <div
        className={`position-absolute bottom-0 start-50 translate-middle-x d-flex flex-wrap gap-1 justify-center mb-1 ${className || ""}`}
        style={{ maxWidth: "90%", ...style }}
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
    );
  }
);

export default MediaItemTags;