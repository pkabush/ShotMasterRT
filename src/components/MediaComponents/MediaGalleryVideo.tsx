import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { LocalVideo } from "../../classes/LocalVideo";
import MediaVideo from "./MediaVideo";

interface Props {
  localVideo: LocalVideo;
  height?: number;
  fillParent?: boolean;            // Fill parent container
  topRightExtra?: React.ReactNode;
  onClick?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;  
  isSelected?: boolean;
  isPicked?: boolean;
}

const MediaGalleryVideo: React.FC<Props> = observer(({
  localVideo,
  height = 250,
  fillParent = false,
  topRightExtra,
  onClick,
  autoPlay = true,
  loop = true,
  muted = true,
  isSelected = false,
  isPicked = false
}) => {
  const [hovered, setHovered] = useState(false);

  const containerHeight = fillParent ? "100%" : `${height}px`;
  const containerWidth = fillParent ? "100%" : "auto";

  return (
    <div
      className="position-relative d-inline-block"
      style={{
        height: containerHeight,
        width: containerWidth,
        cursor: "pointer",
        outline: isPicked ? "3px solid #085db7" : "none",
        outlineOffset: -3,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Green selection circle */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "limegreen",
            border: "2px solid white",
            zIndex: 20,
          }}
        />
      )}

      {/* Use the MobX-powered MediaVideo */}
      <MediaVideo
        localVideo={localVideo}
        onClick={onClick}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        style={{
          height: containerHeight,
          width: containerWidth,
          objectFit: "contain",
          display: "block",
        }}
      />

      {/* Top-right extra container, visible only on hover */}
      {topRightExtra && hovered && (
        <div
          className="position-absolute"
          style={{
            top: "5px",
            right: "5px",
            zIndex: 10,
            display: "flex",
            gap: "5px",
          }}
        >
          {topRightExtra}
        </div>
      )}
    </div>
  );
});

export default MediaGalleryVideo;