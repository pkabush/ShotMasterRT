import React, { type ReactNode } from "react";

interface TopRightExtraProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TopRightExtra: React.FC<TopRightExtraProps> = ({
  children,
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`position-absolute ${className}`}
      style={{
        top: 5,
        right: 5,
        zIndex: 10,
        display: "flex",
        gap: 5,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default TopRightExtra;