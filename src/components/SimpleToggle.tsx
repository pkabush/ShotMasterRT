import React from 'react';

interface Props {
  label: string;
  value: boolean; // controlled value
  onToggle: (newValue: boolean) => void;
  useIndicator?: boolean; // optional: if true, render a small circle instead of label
  activeColor?: string; // NEW: color when toggle is ON
}

const SimpleToggle: React.FC<Props> = ({ label, value, onToggle, useIndicator = false,activeColor = 'green' }) => {
  if (useIndicator) {
    return (
      <div
        onClick={() => onToggle(!value)}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: value ? activeColor : 'transparent',
          border: '2px solid green',
          cursor: 'pointer',
        }}
      />
    );
  }


  return (
    <button
      className="btn btn-sm"
      onClick={() => onToggle(!value)}
      style={{
        backgroundColor: value ? activeColor : 'transparent',
        color: value ? 'white' : '#6c757d',
        border: `1px solid ${activeColor}`,
      }}
    >
      {label}
    </button>
  );
};

export default SimpleToggle;
