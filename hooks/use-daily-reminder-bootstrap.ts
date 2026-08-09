import { useEffect, useRef } from 'react';

import {
  getNotificationPermissionState,
  isNotificationsSupported,
  PERMISSION_DENIED_THRESHOLD,
  requestNotificationPermissions,
  syncDailyReadingNotifications,
} from '@/services/daily-notifications';
import { useBibleStore } from '@/store/bible-store';

export function useDailyReminderBootstrap(ready: boolean): void {
  const dailyReminderEnabled = useBibleStore((s) => s.dailyReminderEnabled);
  const dailyReminderHour = useBibleStore((s) => s.dailyReminderHour);
  const dailyReminderMinute = useBibleStore((s) => s.dailyReminderMinute);
  const translationId = useBibleStore((s) => s.translationId);
  const notificationPermissionDeniedCount = useBibleStore(
    (s) => s.notificationPermissionDeniedCount,
  );
  const clearNotificationPermissionDeniedCount = useBibleStore(
    (s) => s.clearNotificationPermissionDeniedCount,
  );
  const recordNotificationPermissionDenied = useBibleStore(
    (s) => s.recordNotificationPermissionDenied,
  );
  const permissionRequested = useRef(false);

  useEffect(() => {
    if (!ready || !dailyReminderEnabled || !isNotificationsSupported()) return;
    if (permissionRequested.current) return;

    permissionRequested.current = true;

    void (async () => {
      const current = await getNotificationPermissionState();

      if (current.granted) {
        clearNotificationPermissionDeniedCount();
        await syncDailyReadingNotifications({
          hour: dailyReminderHour,
          minute: dailyReminderMinute,
          translationId,
        });
        return;
      }

      if (
        !current.canAskAgain ||
        notificationPermissionDeniedCount >= PERMISSION_DENIED_THRESHOLD
      ) {
        return;
      }

      const requested = await requestNotificationPermissions();

      if (requested.granted) {
        clearNotificationPermissionDeniedCount();
        await syncDailyReadingNotifications({
          hour: dailyReminderHour,
          minute: dailyReminderMinute,
          translationId,
        });
        return;
      }

      recordNotificationPermissionDenied();
    })().catch(() => {});
  }, [
    ready,
    dailyReminderEnabled,
    dailyReminderHour,
    dailyReminderMinute,
    translationId,
    notificationPermissionDeniedCount,
    clearNotificationPermissionDeniedCount,
    recordNotificationPermissionDenied,
  ]);

  useEffect(() => {
    if (!ready || !dailyReminderEnabled || !isNotificationsSupported()) return;

    void syncDailyReadingNotifications({
      hour: dailyReminderHour,
      minute: dailyReminderMinute,
      translationId,
    }).catch(() => {});
  }, [
    ready,
    dailyReminderEnabled,
    dailyReminderHour,
    dailyReminderMinute,
    translationId,
  ]);
}
