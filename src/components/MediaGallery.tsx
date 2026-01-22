import React from 'react';
import CollapsibleContainer from './Atomic/CollapsibleContainer'; // adjust path if needed

interface Props {
  label?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerExtra?: React.ReactNode; // <-- new prop
  editWindow?: React.ReactNode; // <-- new optional prop
}

const MediaGallery: React.FC<Props> = ({
  label = 'Media Gallery',
  children,
  defaultCollapsed = false,
  className = '',
  headerExtra, // receive the prop
  editWindow, // receive it
}) => {
  return (
    <CollapsibleContainer
      label={label}
      defaultCollapsed={defaultCollapsed}
      className={className}
      headerExtra={headerExtra} // pass it down
    >

      {/* Render optional edit window */}
      {editWindow && (
        <div className="mb-3">
          {editWindow}
        </div>
      )}


      <div className="d-flex flex-wrap gap-2">
        {children}
      </div>

    </CollapsibleContainer>
  );
};

export default MediaGallery;
