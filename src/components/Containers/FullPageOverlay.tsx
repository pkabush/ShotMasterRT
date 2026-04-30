import React from "react";

type FullPageOverlayProps = {
  show: boolean;
  children?: React.ReactNode;
};

const FullPageOverlay: React.FC<FullPageOverlayProps> = ({
  show,
  children,
}) => {
  if (!show) return null;

  return <div style={overlayStyle}>{children}</div>;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

export default FullPageOverlay;