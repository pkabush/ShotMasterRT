import React from 'react';
import CollapsibleContainer from './CollapsibleContainer'; // adjust path if needed

interface Props {
  label?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerExtra?: React.ReactNode; // <-- new prop
}

const MediaGallery: React.FC<Props> = ({
  label = 'Media Gallery',
  children,
  defaultCollapsed = false,
  className = '',
  headerExtra, // receive the prop
}) => {
  return (
    <CollapsibleContainer
      label={label}
      defaultCollapsed={defaultCollapsed}
      className={className}
      headerExtra={headerExtra} // pass it down
    >
      <div className="d-flex flex-wrap gap-2">
        {children}
      </div>
    </CollapsibleContainer>
  );
};

export default MediaGallery;
