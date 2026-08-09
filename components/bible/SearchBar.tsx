import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type SearchBarProps = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchBar({ value, onChangeText, placeholder, style, ...rest }: SearchBarProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const color = useThemeColor({}, 'text');
  const placeholderTextColor = useThemeColor({}, 'muted');

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      autoCorrect={false}
      autoCapitalize="none"
      clearButtonMode="while-editing"
      style={[styles.input, { backgroundColor, borderColor, color }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});
