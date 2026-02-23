// TopLeftDot.tsx
import React from "react";

interface TopLeftDotProps {
  size?: number;            // diameter in px
  color?: string;           // dot fill color
  borderColor?: string;     // border color
  borderWidth?: number;     // border width in px
  zIndex?: number;
  style?: React.CSSProperties;
  className?: string;
}

const TopLeftDot: React.FC<TopLeftDotProps> = ({
  size = 20,
  color = "limegreen",
  borderColor = "white",
  borderWidth = 2,
  zIndex = 20,
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        top: 5,
        left: 5,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        border: `${borderWidth}px solid ${borderColor}`,
        zIndex,
        ...style,
      }}
    />
  );
};

export default TopLeftDot;