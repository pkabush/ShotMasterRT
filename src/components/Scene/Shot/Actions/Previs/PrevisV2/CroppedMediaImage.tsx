
import React, { useState } from "react";
import MediaImage from "../../../../../MediaComponents/MediaImage";
import type { LocalImage } from "../../../../../../classes/fileSystem/LocalImage";

interface CroppedMediaImageProps {
    localImage: LocalImage;
    shotIndex: number;
    gridCols?: number;
    gridRows?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const CroppedMediaImage: React.FC<CroppedMediaImageProps> = ({
    localImage,
    shotIndex,
    gridCols = 4,
    gridRows = 4,
    className = "",
    style,
}) => {
    const [aspectRatio, setAspectRatio] = useState<number | undefined>();

    const isStoryboardImage =
        localImage.mediaJson?.getField("storyboard_index") != null;

    const col = shotIndex % gridCols;
    const row = Math.floor(shotIndex / gridRows);

    const xOffset = col * (100 / gridCols);
    const yOffset = row * (100 / gridRows);

    return (
        <div
            className={className}
            style={{
                overflow: "hidden",
                position: "relative",
                width: "100%",
                aspectRatio: aspectRatio
                    ? `${aspectRatio}`
                    : "16 / 9",
                ...style,
            }}
        >
            <MediaImage
                localImage={localImage}
                onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                        setAspectRatio(
                            img.naturalWidth / img.naturalHeight
                        );
                    }
                }}
                style={
                    isStoryboardImage
                        ? {
                              width: "100%",
                              height: "100%",
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              display: "block",
                              transform: "none",
                          }
                        : {
                              width: `${gridCols * 100}%`,
                              height: "auto",
                              maxWidth: "none",
                              maxHeight: "none",
                              display: "block",
                              transform: `translate(-${xOffset}%, -${yOffset}%)`,
                          }
                }
            />
        </div>
    );
};