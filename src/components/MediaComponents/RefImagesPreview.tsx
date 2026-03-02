import React from "react";
import { LocalImage } from "../../classes/fileSystem/LocalImage";
import MediaImage from "./MediaImage";
import BottomCenterLabel from "../Atomic/MediaElements/BottomCenterLabel";

interface RefImagesPreviewProps {
  images: LocalImage[];
  thumbSize?: number; // optional thumbnail size (default 100px)
}

const RefImagesPreview: React.FC<RefImagesPreviewProps> = ({ images, thumbSize = 100 }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="d-flex gap-2 mb-2 flex-wrap">
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            width: thumbSize,
            height: thumbSize,
          }}
        >
          {/* Use MediaImage to handle loading */}
          <MediaImage
            localImage={img}
            alt={`ref-${i}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid #444",
              display: "block",
            }}
          />

          <BottomCenterLabel label={`ref${i+1}`} />
        </div>
      ))}
    </div>
  );
};

export default RefImagesPreview;