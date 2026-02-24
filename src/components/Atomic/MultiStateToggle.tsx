import React from "react";

interface Props {
  states: Record<string, string>; // { stateName: color }
  value: string;                  // current state
  onChange: (newState: string) => void;
  label?: string;
  useIndicator?: boolean;
}

const MultiStateToggle: React.FC<Props> = ({
  states,
  value,
  onChange,
  label,
  useIndicator = false,
}) => {
  const stateKeys = Object.keys(states);

  if (stateKeys.length === 0) return null;

  const currentIndex = stateKeys.indexOf(value);
  const currentColor = states[value];

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % stateKeys.length;
    onChange(stateKeys[nextIndex]);
  };

  if (useIndicator) {
    return (
      <div
        onClick={handleClick}
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: currentColor ?? "transparent",
          border: `2px solid ${currentColor ?? "#6c757d"}`,
          cursor: "pointer",
        }}
        title={value}
      />
    );
  }

  return (
    <button
      className="btn btn-sm"
      onClick={handleClick}
      style={{
        backgroundColor: currentColor ?? "transparent",
        color: currentColor ? "white" : "#6c757d",
        border: `1px solid ${currentColor ?? "#6c757d"}`,
      }}
    >
      {label ?? value}
    </button>
  );
};

export default MultiStateToggle;