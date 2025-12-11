import React from 'react';

interface Props {
  label: string;
  value: boolean; // controlled value
  onToggle: (newValue: boolean) => void;
  useIndicator?: boolean; // optional: if true, render a small circle instead of label
}

const SimpleToggle: React.FC<Props> = ({ label, value, onToggle, useIndicator = false }) => {
  if (useIndicator) {
    return (
      <div
        onClick={() => onToggle(!value)}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: value ? 'green' : 'transparent',
          border: '2px solid green',
          cursor: 'pointer',
        }}
      />
    );
  }

  // old button style
  return (
    <button
      className={`btn btn-sm ${value ? 'btn-success' : 'btn-outline-secondary'}`}
      onClick={() => onToggle(!value)}
    >
      {label}
    </button>
  );
};

export default SimpleToggle;
