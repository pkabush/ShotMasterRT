import React from "react";

interface MediaWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const MediaWrapper: React.FC<MediaWrapperProps> = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default MediaWrapper;