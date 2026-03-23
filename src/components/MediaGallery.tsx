import React from 'react';
import { CollapsibleContainerAccordion } from './Atomic/CollapsibleContainer'; // adjust path if needed
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhotoFilm } from '@fortawesome/free-solid-svg-icons';

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
    <CollapsibleContainerAccordion
      label={label}
      defaultCollapsed={defaultCollapsed}
      className={className}
      headerExtra={headerExtra} // pass it down   
      openColor="#1f402c"
      closedColor="#1b2d22"
      header={
        <>
          {label}
          <FontAwesomeIcon icon={faPhotoFilm} className="mx-2" style={{ color: '#3aaaeb', }} />
        </>
      }
    >

      {/* Children */}
      <div className="d-flex flex-wrap gap-2">
        {children}
      </div>

      {/* Render optional edit window */}
      {editWindow && (
        <div className="mb-3">
          {editWindow}
        </div>
      )}

    </CollapsibleContainerAccordion>
  );
};

export default MediaGallery;
