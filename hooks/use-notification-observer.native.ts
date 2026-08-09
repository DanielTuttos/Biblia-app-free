import * as Notifications from 'expo-notifications';
import {
  router,
  useNavigationContainerRef,
  useRootNavigationState,
  type Href,
} from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { consumeColdStartNotificationPath } from '@/services/notification-cold-start';
import { parseReadNotificationUrl } from '@/utils/navigation';

function extractPath(response: {
  notification: { request: { content: { data?: Record<string, unknown> } } };
}): string | null {
  const url = response.notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
}

export function useNotificationObserver(): void {
  const rootNavigationState = useRootNavigationState();
  const navigationRef = useNavigationContainerRef();
  const navigationReady = rootNavigationState?.key != null;
  const handledResponseId = useRef<string | null>(null);
  const navigatedPath = useRef<string | null>(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  const pushWhenReady = useCallback((href: Href, attempt = 0): void => {
    const maxAttempts = 40;

    if (!navigationRef.isReady()) {
      if (attempt < maxAttempts) {
        setTimeout(() => pushWhenReady(href, attempt + 1), 50);
      }
      return;
    }

    router.push(href);
  }, [navigationRef]);

  const redirectToPath = useCallback(
    (path: string, responseId?: string): void => {
      if (navigatedPath.current === path) return;
      if (responseId && handledResponseId.current === responseId) return;

      const href = parseReadNotificationUrl(path);
      if (!href || !navigationReady) return;

      if (responseId) {
        handledResponseId.current = responseId;
      }

      navigatedPath.current = path;
      pushWhenReady(href);
      Notifications.clearLastNotificationResponse();
    },
    [navigationReady, pushWhenReady],
  );

  useEffect(() => {
    if (!navigationReady) return;

    const path = consumeColdStartNotificationPath();
    if (path) {
      redirectToPath(path);
    }
  }, [navigationReady, redirectToPath]);

  useEffect(() => {
    if (!lastNotificationResponse?.notification || !navigationReady) return;

    if (
      lastNotificationResponse.actionIdentifier &&
      lastNotificationResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const path = extractPath(lastNotificationResponse);
    if (!path) return;

    redirectToPath(path, lastNotificationResponse.notification.request.identifier);
  }, [lastNotificationResponse, navigationReady, redirectToPath]);
}
