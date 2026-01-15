/**
 * Service Worker registration utility.
 * Handles PWA installation and updates.
 */

/**
 * Register the service worker for offline support and PWA features.
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available, notify user
          console.log('[SW] New content available, refresh to update');
          
          // Dispatch custom event for UI to handle
          window.dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { registration },
          }));
        }
      });
    });

    // Handle controller change (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, refreshing...');
    });

  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
}

/**
 * Unregister all service workers (useful for debugging).
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
    console.log('[SW] Service worker unregistered');
  }
}

/**
 * Check if the app is running as an installed PWA.
 */
export function isRunningAsPWA(): boolean {
  // Check display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // iOS Safari specific check
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }

  // Check if launched from home screen
  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
}

/**
 * Request permission for push notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[Notifications] Not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  console.log('[Notifications] Permission:', permission);
  return permission;
}

/**
 * Show a local notification (requires permission).
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (Notification.permission !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return;
  }

  // Use service worker for notifications if available
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
}
