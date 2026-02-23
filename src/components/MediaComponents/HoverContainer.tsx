import React, { type ReactNode, useState } from "react";

interface HoverContainerProps {
    children: ReactNode;       // Main content
    hoverElements?: ReactNode; // Elements to show on hover
}

const HoverContainer: React.FC<HoverContainerProps> = ({
    children,
    hoverElements,
}) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{ display: "inline-block", position: "relative" }} // wrap children
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Children: always visible and interactive */}
            {children}

            {/* Hover elements: cover the whole container */}
            {hovered && hoverElements && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 10,
                        pointerEvents: "none", // hover elements remain clickable
                    }}
                >
                    <div style={{ pointerEvents: "auto" }}>{hoverElements}</div>
                </div>
            )}
        </div>
    );
};

export default HoverContainer;