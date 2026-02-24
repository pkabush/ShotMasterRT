import React from "react";

type SimpleSelectProps = {
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
  colorMap?: Record<string, string>; // optional
};

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  value,
  options,
  onChange,
  label,
  className = "",
  colorMap,
}) => {
  const selectedColor = colorMap?.[value];

  return (
    <div className="btn-group" role="group">
      {label && (
        <span className="btn btn-sm btn-outline-secondary disabled">
          {label}
        </span>
      )}

      <div
        className={`btn btn-sm btn-outline-secondary p-0 ${className}`}
        style={
          selectedColor
            ? {
                backgroundColor: selectedColor,
                borderColor: selectedColor,
              }
            : undefined
        }
      >
        <select
          className="form-select form-select-sm border-0 rounded-0"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={
            selectedColor
              ? {
                  backgroundColor: selectedColor,
                }
              : undefined
          }
        >
          {options.map((opt) => (
            <option
              key={opt}
              value={opt}
              style={
                colorMap?.[opt]
                  ? { backgroundColor: colorMap[opt] }
                  : undefined
              }
            >
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SimpleSelect;