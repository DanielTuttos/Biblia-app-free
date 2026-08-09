import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type HeaderNavButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function HeaderNavButton({ label, disabled = false, onPress }: HeaderNavButtonProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: cardColor,
          borderColor,
          opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
        },
      ]}>
      <ThemedText type="defaultSemiBold" style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 22,
    lineHeight: 26,
  },
});
