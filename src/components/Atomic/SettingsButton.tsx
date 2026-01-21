import React, { useState } from 'react';

interface SettingsButtonProps {
  buttons: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  buttons,
  content,
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`w-100 ${className}`}
      style={{ display: 'inline-block' }}
    >
      {/* Button group */}
      <div className="btn-group" role="group">
        {buttons}

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle settings"
          type="button"
          style={{
            borderBottomRightRadius: open ? 0 : undefined,
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div
          className="w-100 border p-2"
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 5,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
            backgroundColor: '#383838ff',
            marginTop: 0,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default SettingsButton;
