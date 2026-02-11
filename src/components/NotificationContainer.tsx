import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { NotificationItem } from './NotificationItem';
import { notificationManager } from '../classes/NotificationManager';

export const NotificationContainer: React.FC = observer(() => {
  const [hidden, setHidden] = useState(false);

  const count = notificationManager.notifications.length;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        maxWidth: 700,
        pointerEvents: 'none',
      }}
    >
      {/* Notifications */}
      {!hidden && count > 0 && (
        <div
          className="d-flex flex-column gap-0"
          style={{ pointerEvents: 'auto' }}
        >
          {notificationManager.notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div
        className="d-flex gap-1 mt-2 justify-content-start"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Notifications toggle (always visible) */}
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setHidden(v => !v)}
        >
          Notifications ({count})
        </button>

        {/* Clear (only when visible and there is at least one notification) */}
        {!hidden && count > 0 && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => notificationManager.clear()}
          >
            Clear ({count})
          </button>
        )}
      </div>
    </div>
  );
});
