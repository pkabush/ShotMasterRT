// NotificationManager.ts
import { makeAutoObservable } from 'mobx';
import type { LocalMedia } from './fileSystem/LocalMedia';

export const NotificationTypes = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

export type NotificationType =
  typeof NotificationTypes[keyof typeof NotificationTypes];


export interface Notification {
  id: string;
  message: string;
  type: NotificationType;

  // optional media attached
  media?: LocalMedia;

  // callbacks
  onClick?: () => void;
  onClose?: () => void;
}

class NotificationManager {
  notifications: Notification[] = [];

  readonly types = NotificationTypes;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  add(
    message: string,
    type: NotificationType = this.types.info,
    options?: {
      media?: LocalMedia;
      onClick?: () => void;
      onClose?: () => void;
    }
  ) {
    this.notifications.push({
      id: crypto.randomUUID(),
      message,
      type,
      ...options,
    });
  }

  remove(id: string) {
    const notification = this.notifications.find(n => n.id === id);

    if (notification?.onClose) {
      notification.onClose();
    }

    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clear() {
    // trigger onClose for all
    this.notifications.forEach(n => n.onClose?.());
    this.notifications = [];
  }
}

export const notificationManager = new NotificationManager();
