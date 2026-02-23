import React, { type ReactNode } from "react";

interface AddOutlineProps {
  children?: ReactNode;           // optional, you can wrap other elements if needed
  showOutline?: boolean;          // whether to show the outline
  color?: string;                 // outline color
  width?: number;                 // outline width in px
  style?: React.CSSProperties;    // additional styles
  className?: string;
  name?: string;                  // optional name for easier querying
}

const AddOutline: React.FC<AddOutlineProps> = ({
  children,
  showOutline = false,
  color = "#085db7",
  width = 3,
  style,
  className,
  name = "Outline",
}) => {
  return (
    <div
      className={className}
      data-name={name}
      style={{
        position: "absolute",       // absolutely positioned inside parent
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",      // let clicks go through
        border: showOutline ? `${width}px solid ${color}` : "none",
        borderRadius: style?.borderRadius || 0,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default AddOutline;