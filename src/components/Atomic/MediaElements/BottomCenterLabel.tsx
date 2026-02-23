import React from "react";

interface BottomCenterLabelProps {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const BottomCenterLabel: React.FC<BottomCenterLabelProps> = ({
  label,
  className,
  style,
}) => {
  if (!label) return null;

  return (
    <div
      className={`position-absolute bottom-0 start-50 translate-middle-x bg-dark text-white px-2 py-1 rounded small text-nowrap opacity-75 pe-none mb-1 ${className || ""}`}
      style={style}
    >
      {label}
    </div>
  );
};

export default BottomCenterLabel;