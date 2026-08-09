import { Platform } from 'react-native';

import { getDailyReading } from '@/services/daily-reading';
import { formatReference, getBooks } from '@/services/bible-api';
import {
  areNotificationsAvailable,
  getNotificationsModule,
  isExpoGoAndroidWithoutNotifications,
} from '@/services/notifications-module';
import type { DailyReadingRef } from '@/types/bible';

export const DAILY_NOTIFICATION_CHANNEL_ID = 'daily-reading';
export const DEFAULT_DAILY_REMINDER_HOUR = 8;
export const DEFAULT_DAILY_REMINDER_MINUTE = 0;
export const SCHEDULE_DAYS_AHEAD = 14;
export const PERMISSION_DENIED_THRESHOLD = 2;

const DAILY_NOTIFICATION_PREFIX = 'daily-reading-';

export type NotificationPermissionState = {
  granted: boolean;
  canAskAgain: boolean;
};

export function isNotificationsSupported(): boolean {
  return areNotificationsAvailable();
}

export { isExpoGoAndroidWithoutNotifications };

export function buildDailyReadingNotificationUrl(reading: DailyReadingRef): string {
  const params = new URLSearchParams();
  if (reading.verseStart) {
    params.set('verse', String(reading.verseStart));
  }
  const query = params.toString();
  return `/read/${reading.bookId}/${reading.chapter}${query ? `?${query}` : ''}`;
}

export function formatReminderTime(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('es', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function setupNotificationHandler(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync(DAILY_NOTIFICATION_CHANNEL_ID, {
    name: 'Lectura del día',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }

  const settings = await Notifications.getPermissionsAsync();
  const granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  return {
    granted,
    canAskAgain: settings.canAskAgain ?? true,
  };
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionState> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }

  await ensureNotificationChannel();

  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  const granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  return {
    granted,
    canAskAgain: settings.canAskAgain ?? true,
  };
}

async function buildNotificationContent(
  reading: DailyReadingRef,
  translationId: string,
): Promise<{ title: string; body: string; url: string }> {
  const url = buildDailyReadingNotificationUrl(reading);
  let reference = `${reading.bookId} ${reading.chapter}`;

  try {
    const booksData = await getBooks(translationId);
    const book = booksData.books.find((b) => b.id === reading.bookId);
    if (book) {
      reference = formatReference(
        book,
        reading.chapter,
        reading.verseStart,
        reading.verseEnd,
      );
    }
  } catch {
    if (reading.verseStart) {
      reference = `${reading.bookId} ${reading.chapter}:${reading.verseStart}`;
    }
  }

  return {
    title: 'Lectura del día',
    body: reading.label ? `${reading.label} — ${reference}` : reference,
    url,
  };
}

function getScheduleDateForDay(dayOffset: number, hour: number, minute: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function cancelDailyReadingNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const dailyIds = scheduled
    .filter((notification) => notification.identifier.startsWith(DAILY_NOTIFICATION_PREFIX))
    .map((notification) => notification.identifier);

  await Promise.all(
    dailyIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

export async function syncDailyReadingNotifications(options: {
  hour: number;
  minute: number;
  translationId: string;
}): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const { granted } = await getNotificationPermissionState();
  if (!granted) return;

  await ensureNotificationChannel();
  await cancelDailyReadingNotifications();

  let scheduled = 0;
  let dayOffset = 0;

  while (scheduled < SCHEDULE_DAYS_AHEAD) {
    const triggerDate = getScheduleDateForDay(dayOffset, options.hour, options.minute);
    dayOffset += 1;

    if (triggerDate.getTime() <= Date.now()) {
      continue;
    }

    const reading = getDailyReading(triggerDate);
    const content = await buildNotificationContent(reading, options.translationId);

    await Notifications.scheduleNotificationAsync({
      identifier: `${DAILY_NOTIFICATION_PREFIX}${formatDayKey(triggerDate)}`,
      content: {
        title: content.title,
        body: content.body,
        data: { url: content.url },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === 'android' ? DAILY_NOTIFICATION_CHANNEL_ID : undefined,
      },
    });

    scheduled += 1;
  }
}

export async function scheduleTestDailyReadingNotification(
  translationId: string,
  delaySeconds = 3,
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const { granted } = await getNotificationPermissionState();
  if (!granted) {
    throw new Error('Sin permiso de notificaciones');
  }

  await ensureNotificationChannel();

  const reading = getDailyReading();
  const content = await buildNotificationContent(reading, translationId);

  await Notifications.scheduleNotificationAsync({
    identifier: `${DAILY_NOTIFICATION_PREFIX}test-${Date.now()}`,
    content: {
      title: content.title,
      body: content.body,
      data: { url: content.url },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      channelId: Platform.OS === 'android' ? DAILY_NOTIFICATION_CHANNEL_ID : undefined,
    },
  });
}
