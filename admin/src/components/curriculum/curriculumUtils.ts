import { FileText, NotebookText, Video } from 'lucide-react';
import type { LessonType } from '@/types/curriculum';

export const LESSON_TYPES: { value: LessonType; label: string; icon: typeof Video; hint: string }[] = [
  { value: 'video', label: 'Video', icon: Video, hint: 'Upload an MP4/WebM or paste a YouTube / Vimeo link' },
  { value: 'article', label: 'Article', icon: NotebookText, hint: 'Written lesson shown as text' },
  { value: 'document', label: 'PDF / Notes', icon: FileText, hint: 'Upload a PDF or paste a link' },
];

export const typeMeta = (type: LessonType) => LESSON_TYPES.find((t) => t.value === type) ?? LESSON_TYPES[0];

export const formatMinutes = (min: number): string => {
  if (!min) return '0 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** returns the ids in the new order after moving the item at `from` by `delta` places (or the same list if impossible) */
export const shift = <T,>(list: T[], from: number, delta: number): T[] => {
  const to = from + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};