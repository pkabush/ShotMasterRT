
import React from "react";
import { observer } from "mobx-react-lite";
import type { LocalJson } from "../../classes/LocalJson";


type SimpleNumberInputProps = {
  value: number | string;
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
  labelClassName?: string;
  min?: number;
  max?: number;
  step?: number;
};

export const SimpleNumberInput: React.FC<SimpleNumberInputProps> = ({
  value,
  onChange,
  label,
  className = "",
  labelClassName = "btn-outline-secondary",
  min,
  max,
  step = 1,
}) => {
  return (
    <div className="btn-group" role="group">
      {label && (
        <span className={`btn btn-sm disabled ${labelClassName}`}>
          {label}
        </span>
      )}

      <div className={`btn btn-sm btn-outline-secondary p-0 ${className}`}>
        <input
          type="number"
          className="form-control form-control-sm border-0 rounded-0"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") return;
            
            const parsed = Number(val);
            if (!Number.isNaN(parsed)) {
              onChange?.(parsed);
            }
          }}
        />
      </div>
    </div>
  );
};




type EditableJsonNumberInputProps = {
  localJson: LocalJson | null;
  field: string;
  label?: string;
  default_val?: number;
  min?: number;
  max?: number;
  step?: number;
};

export const EditableJsonNumberInput: React.FC<EditableJsonNumberInputProps> = observer(({
  localJson,
  field,
  label,
  default_val,
  min,
  max,
  step = 1,
}) => {
  if (!localJson) return null;

  const value = localJson.getField(field) ?? default_val ?? "";

  return (
    <SimpleNumberInput
      value={value}
      label={label}
      min={min}
      max={max}
      step={step}
      onChange={(val) => {
        localJson.updateField(field, val);
      }}
    />
  );
});
