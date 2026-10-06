import React, { useState } from "react";
import MediaImage from "../../../../../MediaComponents/MediaImage";
import type { LocalImage } from "../../../../../../classes/fileSystem/LocalImage";

interface CroppedMediaImageProps {
    localImage: LocalImage;
    shotIndex: number; // 0 to 15 for a 4x4 grid
    gridCols?: number; // Defaults to 4
    gridRows?: number; // Defaults to 4
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

    const col = shotIndex % gridCols;
    const row = Math.floor(shotIndex / gridRows);

    const xOffset = col * (100 / gridCols); // 25% per column
    const yOffset = row * (100 / gridRows); // 25% per row

    return (
        <div
            className={className}
            style={{
                overflow: "hidden",
                position: "relative",
                width: "100%",
                aspectRatio: aspectRatio ? `${aspectRatio}` : "16 / 9",
                ...style,
            }}
        >
            <MediaImage
                localImage={localImage}
                onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                        setAspectRatio(img.naturalWidth / img.naturalHeight);
                    }
                }}
                style={{
                    width: `${gridCols * 100}%`,
                    height: "auto", 
                    maxWidth: "none",
                    maxHeight: "none",
                    display: "block",
                    transform: `translate(-${xOffset}%, -${yOffset}%)`,
                }}
            />
        </div>
    );
};