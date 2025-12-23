import React from "react";

interface LoadingSpinnerProps {
  isLoading: boolean;
  className?: string;
  asButton?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  className = "",
  asButton = false,
}) => {
  const spinner = (
    <span
      className={`spinner-border spinner-border-sm`}
      role="status"
      aria-hidden="true"
      style={{
        animation: isLoading ? undefined : "none",
        borderColor: isLoading ? undefined : "#6c757d",
      }}
    />
  );

  if (!asButton) {
    return <span className={className}>{spinner}</span>;
  }

  return (
    <button
      type="button"
      className={`btn btn-sm btn-outline-secondary disabled d-flex align-items-center justify-content-center ${className}`}
      tabIndex={-1}
      style={{
        pointerEvents: "none",
      }}
    >
      {spinner}
    </button>
  );
};

export default LoadingSpinner;
