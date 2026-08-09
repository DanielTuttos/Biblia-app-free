import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

let coldStartNotificationPath: string | null = null;

function captureNotificationPath(response: {
  notification: { request: { content: { data?: Record<string, unknown> } } };
}): void {
  const url = response.notification.request.content.data?.url;
  if (typeof url === 'string') {
    coldStartNotificationPath = url;
  }
}

export function consumeColdStartNotificationPath(): string | null {
  const path = coldStartNotificationPath;
  coldStartNotificationPath = null;
  return path;
}

const notificationsSupported =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

if (notificationsSupported) {
  // Import síncrono: en iOS el listener debe registrarse antes de que arranque React.
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  Notifications.addNotificationResponseReceivedListener((response) => {
    captureNotificationPath(response);
  });

  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse?.notification) {
    captureNotificationPath(lastResponse);
  }
}
