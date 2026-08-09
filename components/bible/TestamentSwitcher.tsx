import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type Testament = 'ot' | 'nt';

type TestamentSwitcherProps = {
  value: Testament;
  onChange: (value: Testament) => void;
  oldCount: number;
  newCount: number;
};

const OPTIONS: { value: Testament; label: string }[] = [
  { value: 'ot', label: 'Antiguo' },
  { value: 'nt', label: 'Nuevo' },
];

export function TestamentSwitcher({ value, onChange, oldCount, newCount }: TestamentSwitcherProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');
  const muted = useThemeColor({}, 'muted');
  const textColor = useThemeColor({}, 'text');

  const counts: Record<Testament, number> = { ot: oldCount, nt: newCount };

  return (
    <View style={[styles.track, { backgroundColor: borderColor, borderColor }]}>
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: accent },
              pressed && !selected && styles.pressed,
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={[
                styles.label,
                { color: selected ? '#FFFFFF' : textColor },
              ]}>
              {option.label}
            </ThemedText>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: selected ? 'rgba(255,255,255,0.22)' : backgroundColor,
                  borderColor: selected ? 'transparent' : borderColor,
                },
              ]}>
              <ThemedText
                style={[
                  styles.badgeText,
                  { color: selected ? '#FFFFFF' : muted },
                ]}>
                {counts[option.value]}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 11,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
