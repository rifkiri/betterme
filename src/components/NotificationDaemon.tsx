import { useNotificationDaemon } from '@/hooks/useNotificationDaemon';

/** Invisible component that runs the notification daemon inside AuthProvider. */
export const NotificationDaemon = () => {
  useNotificationDaemon();
  return null;
};
