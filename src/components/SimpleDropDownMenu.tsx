import React, { useState, type ReactNode } from "react";

interface DropDownMenuProps {
  label: string | ReactNode;
  children: ReactNode;

  direction?: "down" | "right" | "left";

  className?: string;
  style?: React.CSSProperties;
}

const SimpleDropDownMenu: React.FC<DropDownMenuProps> = ({
  label,
  children,
  direction = "down",
  className,
  style,
}) => {
  const [open, setOpen] = useState(false);

  // Positioning based on direction
  const getPositionStyle = () => {
    switch (direction) {
      case "right":
        return { top: 0, left: "calc(100% - 2px)" };
      case "left":
        return { top: 0, right: "calc(100% - 2px)" };
      default:
        return { top: "100%", left: 0 };
    }
  };

  return (
    <div
      className={`position-relative ${className || ""}`} // remove d-inline-block
      style={{ margin: 0, padding: 0, ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Label */}
      <div
        className="px-2 py-1 hover-bg-light"
        style={{ cursor: "pointer", whiteSpace: "nowrap", width: "100%" }} // full width
      >
        {label}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="border shadow"
          style={{
            position: "absolute",
            backgroundColor: "var(--bs-body-bg)",
            zIndex: 20,
            minWidth: 150,
            display: "flex",           // stack children vertically
            flexDirection: "column",   // vertical layout
            padding: 0,                // no padding in container
            ...getPositionStyle(),
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default SimpleDropDownMenu;
