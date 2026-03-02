// SimpleButton.tsx
import React from 'react';

interface Props {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  label?: React.ReactNode;
  className?: string;
  tooltip?: string;
}

const SimpleButton: React.FC<Props> = ({
  onClick,
  label = 'Click',
  className = '',
  tooltip,
}) => {
  return (
    <button
      className={`btn btn-sm btn-outline-secondary ${className}`}
      onClick={(e) => onClick?.(e)}
      title={tooltip}
    >
      {label}
    </button>
  );
};
export default SimpleButton;
