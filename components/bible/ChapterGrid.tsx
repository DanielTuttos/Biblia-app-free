import { NumberGrid } from '@/components/bible/NumberGrid';

type ChapterGridProps = {
  totalChapters: number;
  onSelectChapter: (chapter: number) => void;
};

export function ChapterGrid({ totalChapters, onSelectChapter }: ChapterGridProps) {
  return <NumberGrid total={totalChapters} onSelect={onSelectChapter} />;
}
