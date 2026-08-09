import { useFonts, Lora_400Regular, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '@/services/notification-cold-start';

import { getNavThemeColors, getStackScreenOptions } from '@/constants/navigation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDailyReminderBootstrap } from '@/hooks/use-daily-reminder-bootstrap';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import { ensureTranslationOffline } from '@/services/bible-api';
import { setupNotificationHandler } from '@/services/daily-notifications';
import { useBibleStore } from '@/store/bible-store';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...getNavThemeColors('light'),
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...getNavThemeColors('dark'),
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useBibleStore((s) => s.hydrate);
  const hydrated = useBibleStore((s) => s.hydrated);
  const translationId = useBibleStore((s) => s.translationId);
  const navTheme = colorScheme === 'dark' ? DarkNavTheme : LightNavTheme;
  const backgroundColor = navTheme.colors.background;
  const stackScreenOptions = getStackScreenOptions(colorScheme === 'dark' ? 'dark' : 'light');

  const [fontsLoaded] = useFonts({
    Lora: Lora_400Regular,
    'Lora-SemiBold': Lora_600SemiBold,
    'Lora-Bold': Lora_700Bold,
  });

  const appReady = fontsLoaded && hydrated;

  useNotificationObserver();
  useDailyReminderBootstrap(appReady);

  useEffect(() => {
    void setupNotificationHandler();
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    void ensureTranslationOffline(translationId).catch(() => {});
  }, [hydrated, translationId]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady]);

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book/[bookId]" options={{ headerShown: false }} />
        <Stack.Screen name="book/[bookId]/[chapter]" options={{ headerShown: false }} />
        <Stack.Screen name="read/[bookId]/[chapter]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
