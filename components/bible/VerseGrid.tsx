import { NumberGrid } from '@/components/bible/NumberGrid';

type VerseGridProps = {
  totalVerses: number;
  onSelectVerse: (verse: number) => void;
};

export function VerseGrid({ totalVerses, onSelectVerse }: VerseGridProps) {
  return <NumberGrid total={totalVerses} onSelect={onSelectVerse} />;
}
