// NotificationItem.tsx
import React from 'react';
import { notificationManager, type Notification } from '../classes/NotificationManager';
import { MediaPreviewSmall } from './MediaPreviewSmall';


const typeToBootstrap: Record<string, string> = {
  info: 'alert-primary',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-danger',
};

interface Props {
  notification: Notification;
}

export const NotificationItem: React.FC<Props> = ({ notification }) => {
  const clickable = Boolean(notification.onClick);

  const handleClick = () => {
    notification.onClick?.();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    notificationManager.remove(notification.id);
  };

  return (
    <div
      className={`alert ${typeToBootstrap[notification.type]} shadow-sm d-flex align-items-center mb-1 p-1`}
      role="alert"
      onClick={clickable ? handleClick : undefined}
      style={{
        cursor: clickable ? 'pointer' : 'default',
        paddingRight: '2.5rem',
        userSelect: 'none',
      }}
    >
      {/* Flex container to align message + optional media */}
      <div className="d-flex align-items-center flex-grow-1">
        <span className="me-1">{notification.message}</span>        
        {notification.media && (
            
          <MediaPreviewSmall media={notification.media} hoverPosition="top" inlinePreviewHeight={25} />
          
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        className="btn-close ms-3"
        aria-label="Close"
        onClick={handleClose}
      />
    </div>
  );
};
