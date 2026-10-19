import React from "react";

type SimpleSelectProps = {
  value: string;
  options: string[];
  onChange?: (value: string, index: number) => void;
  label?: string;
  className?: string;
  labelClassName?: string;
  colorMap?: Record<string, string>; // optional
};

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  value,
  options,
  onChange,
  label,
  className = "",
  labelClassName = "btn-outline-secondary",
  colorMap,
}) => {
  const selectedColor = colorMap?.[value];

  return (
    <div className="btn-group" role="group">
      {label && (
        <span className={`btn btn-sm disabled ${labelClassName}`}>
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
          onChange={(e) => {
            const index = e.target.selectedIndex;
            onChange?.(e.target.value, index);
          }}
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