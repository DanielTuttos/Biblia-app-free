import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_TRANSLATION_ID,
  getDefaultTranslationForLanguage,
} from '@/constants/translations';
import {
  DEFAULT_DAILY_REMINDER_HOUR,
  DEFAULT_DAILY_REMINDER_MINUTE,
} from '@/services/daily-notifications';
import type { ColorSchemePreference, LastReading } from '@/types/bible';

const STORAGE_KEY = '@biblia/preferences';

type BiblePreferences = {
  translationId: string;
  language: string;
  fontSize: number;
  colorSchemePreference: ColorSchemePreference;
  lastReading: LastReading | null;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  notificationPermissionDeniedCount: number;
};

type BibleStore = BiblePreferences & {
  hydrated: boolean;
  setLanguage: (language: string) => void;
  setTranslationId: (translationId: string) => void;
  setFontSize: (fontSize: number) => void;
  setColorSchemePreference: (preference: ColorSchemePreference) => void;
  setLastReading: (reading: LastReading | null) => void;
  setDailyReminderEnabled: (enabled: boolean) => void;
  setDailyReminderTime: (hour: number, minute: number) => void;
  recordNotificationPermissionDenied: () => void;
  clearNotificationPermissionDeniedCount: () => void;
  hydrate: () => Promise<void>;
};

const DEFAULTS: BiblePreferences = {
  translationId: DEFAULT_TRANSLATION_ID,
  language: DEFAULT_LANGUAGE,
  fontSize: 18,
  colorSchemePreference: 'system',
  lastReading: null,
  dailyReminderEnabled: true,
  dailyReminderHour: DEFAULT_DAILY_REMINDER_HOUR,
  dailyReminderMinute: DEFAULT_DAILY_REMINDER_MINUTE,
  notificationPermissionDeniedCount: 0,
};

function pickPreferences(state: BibleStore): BiblePreferences {
  return {
    translationId: state.translationId,
    language: state.language,
    fontSize: state.fontSize,
    colorSchemePreference: state.colorSchemePreference,
    lastReading: state.lastReading,
    dailyReminderEnabled: state.dailyReminderEnabled,
    dailyReminderHour: state.dailyReminderHour,
    dailyReminderMinute: state.dailyReminderMinute,
    notificationPermissionDeniedCount: state.notificationPermissionDeniedCount,
  };
}

async function persistPreferences(state: BiblePreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useBibleStore = create<BibleStore>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  setLanguage: (language) => {
    const translationId = getDefaultTranslationForLanguage(language);
    const next = { ...get(), language, translationId };
    set({ language, translationId });
    void persistPreferences(pickPreferences(next));
  },

  setTranslationId: (translationId) => {
    const next = { ...get(), translationId };
    set({ translationId });
    void persistPreferences(pickPreferences(next));
  },

  setFontSize: (fontSize) => {
    const next = { ...get(), fontSize };
    set({ fontSize });
    void persistPreferences(pickPreferences(next));
  },

  setColorSchemePreference: (colorSchemePreference) => {
    const next = { ...get(), colorSchemePreference };
    set({ colorSchemePreference });
    void persistPreferences(pickPreferences(next));
  },

  setLastReading: (lastReading) => {
    const next = { ...get(), lastReading };
    set({ lastReading });
    void persistPreferences(pickPreferences(next));
  },

  setDailyReminderEnabled: (dailyReminderEnabled) => {
    const next = { ...get(), dailyReminderEnabled };
    set({ dailyReminderEnabled });
    void persistPreferences(pickPreferences(next));
  },

  setDailyReminderTime: (dailyReminderHour, dailyReminderMinute) => {
    const next = { ...get(), dailyReminderHour, dailyReminderMinute };
    set({ dailyReminderHour, dailyReminderMinute });
    void persistPreferences(pickPreferences(next));
  },

  recordNotificationPermissionDenied: () => {
    const notificationPermissionDeniedCount = get().notificationPermissionDeniedCount + 1;
    const next = { ...get(), notificationPermissionDeniedCount };
    set({ notificationPermissionDeniedCount });
    void persistPreferences(pickPreferences(next));
  },

  clearNotificationPermissionDeniedCount: () => {
    const next = { ...get(), notificationPermissionDeniedCount: 0 };
    set({ notificationPermissionDeniedCount: 0 });
    void persistPreferences(pickPreferences(next));
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BiblePreferences>;
        set({
          translationId: parsed.translationId ?? DEFAULTS.translationId,
          language: parsed.language ?? DEFAULTS.language,
          fontSize: parsed.fontSize ?? DEFAULTS.fontSize,
          colorSchemePreference: parsed.colorSchemePreference ?? DEFAULTS.colorSchemePreference,
          lastReading: parsed.lastReading ?? null,
          dailyReminderEnabled: parsed.dailyReminderEnabled ?? DEFAULTS.dailyReminderEnabled,
          dailyReminderHour: parsed.dailyReminderHour ?? DEFAULTS.dailyReminderHour,
          dailyReminderMinute: parsed.dailyReminderMinute ?? DEFAULTS.dailyReminderMinute,
          notificationPermissionDeniedCount:
            parsed.notificationPermissionDeniedCount ?? DEFAULTS.notificationPermissionDeniedCount,
          hydrated: true,
        });
        return;
      }
    } catch {
      // Fall back to defaults.
    }
    set({ hydrated: true });
  },
}));
