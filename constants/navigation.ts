import { Platform } from 'react-native';

import { ReadingColors } from '@/constants/theme';

type StackPalette = (typeof ReadingColors)['light'];

export function getStackScreenOptions(colorScheme: 'light' | 'dark') {
  const colors: StackPalette = ReadingColors[colorScheme];

  return {
    contentStyle: { backgroundColor: colors.background },
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text },
    headerShadowVisible: false,
    ...(Platform.OS === 'ios'
      ? {
          headerBlurEffect: 'none' as const,
          headerTransparent: false,
        }
      : {}),
  };
}

export function getNavThemeColors(colorScheme: 'light' | 'dark') {
  const colors = ReadingColors[colorScheme];
  return {
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.cardBorder,
    primary: colors.accent,
  };
}