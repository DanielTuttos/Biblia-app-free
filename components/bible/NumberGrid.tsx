import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';
import { computeGridMetrics } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';

type NumberGridProps = {
  total: number;
  onSelect: (value: number) => void;
};

export function NumberGrid({ total, onSelect }: NumberGridProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');
  const [gridWidth, setGridWidth] = useState(0);

  const { cellSize } = computeGridMetrics(gridWidth);
  const items = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View
      onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
      style={styles.grid}>
      {items.map((value) => (
        <Pressable
          key={value}
          onPress={() => onSelect(value)}
          style={({ pressed }) => [
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              backgroundColor: pressed ? accent : cardColor,
              borderColor: pressed ? accent : borderColor,
            },
          ]}>
          {({ pressed }) => (
            <ThemedText
              type="defaultSemiBold"
              style={pressed ? styles.cellTextPressed : undefined}>
              {value}
            </ThemedText>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.gridGap,
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellTextPressed: {
    color: '#FFFFFF',
  },
});
