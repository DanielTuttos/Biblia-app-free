import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { ReadingTypography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useBibleStore } from '@/store/bible-store';
import type { ApiTranslationBookChapter } from '@/types/bible';
import { getVerseText } from '@/services/bible-api';

type VerseBlockProps = {
  chapter: ApiTranslationBookChapter;
  flashVerse?: number;
  onVerseLayout?: (verseNumber: number, y: number) => void;
};

type VerseRowProps = {
  verse: ApiTranslationBookChapter['chapter']['content'][number] & { type: 'verse' };
  isFlashing: boolean;
  fontSize: number;
  textColor: string;
  verseNumberColor: string;
  accent: string;
  onVerseLayout?: (verseNumber: number, y: number) => void;
};

function VerseRow({
  verse,
  isFlashing,
  fontSize,
  textColor,
  verseNumberColor,
  accent,
  onVerseLayout,
}: VerseRowProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (isFlashing) {
      setOverlayVisible(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!overlayVisible) return;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setOverlayVisible(false);
    });
  }, [isFlashing, overlayOpacity, overlayVisible]);

  const handleLayout = (event: LayoutChangeEvent) => {
    onVerseLayout?.(verse.number, event.nativeEvent.layout.y);
  };

  return (
    <View onLayout={handleLayout} style={styles.verseRow}>
      {overlayVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashHighlight,
            {
              opacity: overlayOpacity,
              backgroundColor: `${accent}40`,
              borderColor: accent,
            },
          ]}
        />
      ) : null}
      <Text style={[styles.verseNumber, { color: verseNumberColor, fontSize: fontSize * 0.65 }]}>
        {verse.number}
      </Text>
      <Text
        style={[
          styles.verseText,
          {
            color: textColor,
            fontSize,
            lineHeight: fontSize * ReadingTypography.lineHeightMultiplier,
            fontFamily: 'Lora',
          },
        ]}>
        {getVerseText(verse)}
      </Text>
    </View>
  );
}

export function VerseBlock({ chapter, flashVerse, onVerseLayout }: VerseBlockProps) {
  const fontSize = useBibleStore((s) => s.fontSize);
  const textColor = useThemeColor({}, 'text');
  const verseNumberColor = useThemeColor({}, 'verseNumber');
  const accent = useThemeColor({}, 'accent');

  const verses = chapter.chapter.content.filter(
    (item): item is ApiTranslationBookChapter['chapter']['content'][number] & { type: 'verse' } =>
      item.type === 'verse',
  );

  return (
    <View style={styles.container}>
      {verses.map((verse) => (
        <VerseRow
          key={verse.number}
          verse={verse}
          isFlashing={flashVerse === verse.number}
          fontSize={fontSize}
          textColor={textColor}
          verseNumberColor={verseNumberColor}
          accent={accent}
          onVerseLayout={onVerseLayout}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: ReadingTypography.verseSpacing,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    position: 'relative',
  },
  flashHighlight: {
    position: 'absolute',
    top: -6,
    right: -8,
    bottom: -6,
    left: -8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  verseNumber: {
    fontWeight: '700',
    minWidth: 24,
    marginTop: 2,
    fontFamily: 'Lora',
  },
  verseText: {
    flex: 1,
  },
});
