// DropArea.tsx
import React, { useState } from "react";
import type { FC, ReactNode } from "react";

interface DropAreaProps {
    width?: string | number;
    height?: string | number;
    onDrop: (file: File[]) => void;
    children?: ReactNode; // optional content inside the box
}

const DropArea: FC<DropAreaProps> = ({
    width = 400,
    height = 200,
    onDrop,
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files  = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onDrop(files);
        }
    };

    return (
        <div
            className={`drop-area ${isDragging ? "dragging" : ""}`}
            style={{
                width,
                height,
                border: isDragging ? "2px solid #42a5f5" : "2px dashed #606060",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: isDragging ? "#294457" : "#2a2a31",
                boxShadow: isDragging ? "0 0 10px rgba(66,165,245,0.5)" : "none",
                transition: "all 0.2s ease-in-out",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {children || (
                <span style={{ display: "block", textAlign: "center", width: "100%",color:"#5e727e" }}>
                    Drag and Drop Here
                </span>
            )}
        </div>
    );

}

    export default DropArea;



