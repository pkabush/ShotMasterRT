import React, { useState } from 'react';
import LoadingSpinner from './Atomic/LoadingSpinner';

interface SettingsButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  buttonLabel?: React.ReactNode;
  className?: string;
  isLoading?:boolean;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  children,
  onClick,
  buttonLabel = 'Action',
  className = '',
  isLoading = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`w-100 ${className}`} style={{ 
        display: 'inline-block' 
      }}>
      {/* Unified button group */}
      <div className="btn-group" role="group">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onClick}
          style={{
            borderBottomLeftRadius: open ? 0 : undefined,
          }}
        >
          {buttonLabel}
        </button>

      <LoadingSpinner isLoading={isLoading} asButton />

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle settings"
          type="button"
          style={{
            borderBottomRightRadius: open ? 0 : undefined,
          }}
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
            borderTopRightRadius: 5,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
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
