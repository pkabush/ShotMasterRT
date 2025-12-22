import React, { useState } from 'react';
import SimpleButton from './SimpleButton';

interface SettingsButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  buttonLabel?: React.ReactNode;
  className?: string;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  children,
  onClick,
  buttonLabel = 'Action',
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`w-100 ${className}`} style={{ display: 'inline-block' }}>
      {/* Unified button group */}
      <div className="btn-group" role="group">
        <SimpleButton
          onClick={onClick}
          label={buttonLabel}
          className={`${
            open ? 'rounded-0' : 'rounded-end-0'
          }`} // squared corners when open
        />
        <button
          className={`btn btn-sm btn-outline-secondary ${
            open ? 'rounded-0' : 'rounded-start-0'
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle settings"
          type="button"
        >
          ⚙️
        </button>
      </div>

      {/* Settings content */}
      {open && (
        <div
          className="w-100 border p-2"
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            backgroundColor: '#383838ff', // light yellow background
            marginTop: '0px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsButton;
