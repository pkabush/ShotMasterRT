// SimpleButton.tsx
import React from 'react';

interface Props {
  onClick: () => void; // function to call on click
  label?: string;       // optional button label
  className?: string;   // optional extra classes
}

const SimpleButton: React.FC<Props> = ({ onClick, label = 'Click', className = '' }) => {
  return (
    <button className={`btn btn-sm btn-outline-secondary ${className}`} onClick={onClick}>
      {label}
    </button>
  );
};

export default SimpleButton;
