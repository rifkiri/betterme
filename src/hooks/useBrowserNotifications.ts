import { useCallback, useEffect, useState } from 'react';

type PermissionState = NotificationPermission | 'unsupported';

const isSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const useBrowserNotifications = (autoRequest = true) => {
  const [permission, setPermission] = useState<PermissionState>(
    isSupported() ? Notification.permission : 'unsupported'
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported()) return 'unsupported' as PermissionState;
    if (Notification.permission === 'default') {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    }
    setPermission(Notification.permission);
    return Notification.permission;
  }, []);

  useEffect(() => {
    if (autoRequest && isSupported() && Notification.permission === 'default') {
      requestPermission();
    }
  }, [autoRequest, requestPermission]);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported() || Notification.permission !== 'granted') return null;
      try {
        const n = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
        return n;
      } catch (e) {
        console.error('Failed to show notification', e);
        return null;
      }
    },
    []
  );

  return { permission, requestPermission, notify, isSupported: isSupported() };
};
