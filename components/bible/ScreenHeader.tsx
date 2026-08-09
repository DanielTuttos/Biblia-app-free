import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';

type ScreenHeaderProps = {
  title: string;
  backLabel?: string;
  right?: ReactNode;
  onBack?: () => void;
  variant?: 'default' | 'reading';
};

export function ScreenHeader({
  title,
  backLabel = 'Atrás',
  right,
  onBack,
  variant = 'default',
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { containerStyle, horizontalPadding } = useResponsiveLayout({ variant });
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: insets.top, backgroundColor, borderBottomColor: borderColor },
      ]}>
      <View style={[styles.row, containerStyle, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.side}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={24} color={accent} />
            <ThemedText style={[styles.backLabel, { color: accent }]} numberOfLines={1}>
              {backLabel}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.center}>
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>

        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  side: {
    width: 108,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 4,
    maxWidth: 108,
  },
  backLabel: {
    fontSize: 16,
    marginLeft: -2,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
