// LoadingButton.tsx
import React from "react";
import SimpleButton from "./SimpleButton";

interface LoadingButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  is_loading?: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  onClick,
  label = "Click",
  className = "",
  is_loading = false,
}) => {
  return (
    <SimpleButton
      onClick={onClick}
      className={`${className} ${is_loading ? "disabled" : ""}`}
      label={
        <span className="d-flex align-items-center justify-content-center">
          {/* Spinner always visible */}
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
            style={{
              animation: is_loading ? undefined : "none", // stop spinning
              borderColor: is_loading
                ? undefined // default spinning colors
                : "#6c757d", // full circle color when not loading
            }}
          ></span>

          <span>{label}</span>
        </span>
      }
    />
  );
};

export default LoadingButton;
