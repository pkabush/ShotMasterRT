import React from "react";


export const GrayscaleOverlay: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",         // Fill parent
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",        // Allow interactions through
        backdropFilter: "grayscale(100%)",
        zIndex: 10,                   // Make sure it's on top of parent content
        transition: "filter 2.3s ease",
      }}
    />
  );
};

export default GrayscaleOverlay;

