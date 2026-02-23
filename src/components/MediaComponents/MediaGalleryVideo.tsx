import React from "react";
import { observer } from "mobx-react-lite";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import MediaVideo from "./MediaVideo";

interface Props {
  localVideo: LocalVideo;
  height?: number;
  fillParent?: boolean;            // Fill parent container
  onClick?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;  
}

const MediaGalleryVideo: React.FC<Props> = observer(({
  localVideo,
  height = 250,
  fillParent = false,
  onClick,
  autoPlay = true,
  loop = true,
  muted = true,
}) => {

  const containerHeight = fillParent ? "100%" : `${height}px`;
  const containerWidth = fillParent ? "100%" : "auto";

  return (
    <div
      className="position-relative d-inline-block"
      style={{
        height: containerHeight,
        width: containerWidth,
        cursor: "pointer",
      }}
    >

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
    </div>
  );
});

export default MediaGalleryVideo;