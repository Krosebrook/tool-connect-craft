import { useState, useEffect, useCallback, useRef } from 'react';

interface HealthCheckResult {
  connectorId: string;
  connectorName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

interface NotificationState {
  permission: NotificationPermission;
  supported: boolean;
}

/**
 * Hook to manage browser push notifications for health alerts.
 * Tracks connector status changes and sends notifications when status degrades.
 */
export function useHealthNotifications() {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default',
    supported: false,
  });
  const [enabled, setEnabled] = useState(false);
  const previousStatusRef = useRef<Map<string, string>>(new Map());

  // Check notification support and permission on mount
  useEffect(() => {
    const supported = 'Notification' in window;
    setNotificationState({
      permission: supported ? Notification.permission : 'denied',
      supported,
    });

    // Load preference from localStorage
    const savedPreference = localStorage.getItem('healthNotificationsEnabled');
    if (savedPreference === 'true' && Notification.permission === 'granted') {
      setEnabled(true);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!notificationState.supported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      setEnabled(true);
      localStorage.setItem('healthNotificationsEnabled', 'true');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notifications blocked by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        setEnabled(true);
        localStorage.setItem('healthNotificationsEnabled', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [notificationState.supported]);

  // Enable/disable notifications
  const toggleNotifications = useCallback(async (enable: boolean) => {
    if (enable) {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    
    setEnabled(enable);
    localStorage.setItem('healthNotificationsEnabled', enable ? 'true' : 'false');
    return true;
  }, [requestPermission]);

  // Send a notification
  const sendNotification = useCallback((
    title: string,
    options?: NotificationOptions
  ) => {
    if (!enabled || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'health-alert',
        ...options,
      });

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }, [enabled]);

  // Check for status changes and send notifications
  const checkHealthChanges = useCallback((results: HealthCheckResult[]) => {
    if (!enabled) return;

    const alerts: { connector: string; oldStatus: string; newStatus: string }[] = [];

    results.forEach((result) => {
      const previousStatus = previousStatusRef.current.get(result.connectorId);
      
      // Only notify on status degradation (not initial check)
      if (previousStatus && previousStatus !== result.status) {
        // Notify when status worsens
        if (
          (previousStatus === 'healthy' && result.status !== 'healthy') ||
          (previousStatus === 'degraded' && result.status === 'unhealthy')
        ) {
          alerts.push({
            connector: result.connectorName,
            oldStatus: previousStatus,
            newStatus: result.status,
          });
        }
      }

      // Update the stored status
      previousStatusRef.current.set(result.connectorId, result.status);
    });

    // Send consolidated notification if there are alerts
    if (alerts.length > 0) {
      const title = alerts.length === 1
        ? `⚠️ ${alerts[0].connector} is ${alerts[0].newStatus}`
        : `⚠️ ${alerts.length} connectors have issues`;

      const body = alerts.length === 1
        ? `Status changed from ${alerts[0].oldStatus} to ${alerts[0].newStatus}`
        : alerts.map(a => `${a.connector}: ${a.newStatus}`).join('\n');

      sendNotification(title, {
        body,
        requireInteraction: true,
      });
    }
  }, [enabled, sendNotification]);

  // Send a test notification
  const sendTestNotification = useCallback(() => {
    return sendNotification('🔔 Health Notifications Enabled', {
      body: 'You will be notified when connector health degrades.',
    });
  }, [sendNotification]);

  return {
    supported: notificationState.supported,
    permission: notificationState.permission,
    enabled,
    requestPermission,
    toggleNotifications,
    checkHealthChanges,
    sendTestNotification,
  };
}
