import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type * as NotificationsTypes from 'expo-notifications';

type NotificationsModule = typeof NotificationsTypes;

let notificationsModule: NotificationsModule | null = null;
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

export function isExpoGoAndroidWithoutNotifications(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

export function areNotificationsAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (isExpoGoAndroidWithoutNotifications()) return false;
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!areNotificationsAvailable()) return null;

  if (notificationsModule) return notificationsModule;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((module) => {
        notificationsModule = module;
        return module;
      })
      .catch(() => null);
  }

  return notificationsModulePromise;
}

/** Precarga el módulo en cuanto sea posible (importante en cold start de iOS). */
export function preloadNotificationsModule(): void {
  void getNotificationsModule();
}
