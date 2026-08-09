import { DAILY_READINGS } from '@/constants/daily-readings';
import type { DailyReadingRef } from '@/types/bible';

export function getDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getDailyReading(date = new Date()): DailyReadingRef {
  const index = getDayOfYear(date) % DAILY_READINGS.length;
  return DAILY_READINGS[index];
}
