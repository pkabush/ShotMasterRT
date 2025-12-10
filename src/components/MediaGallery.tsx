import React from 'react';
import CollapsibleContainer from './CollapsibleContainer'; // adjust path if needed

interface Props {
  label?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

const MediaGallery: React.FC<Props> = ({
  label = 'Media Gallery',
  children,
  defaultCollapsed = false,
  className = '',
}) => {
  return (
    <CollapsibleContainer
      label={label}
      defaultCollapsed={defaultCollapsed}
      className={className}
    >
      <div className="d-flex flex-wrap gap-2">
        {children}
      </div>
    </CollapsibleContainer>
  );
};

export default MediaGallery;
