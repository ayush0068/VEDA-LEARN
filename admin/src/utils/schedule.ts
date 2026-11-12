import type { InstructorRole, SlotDraft, SlotKind } from '@/types/instructor';

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** weeks start on Monday in the panel */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const toMinutes = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** "18:30" -> "6:30 PM" */
export const formatTime = (hhmm: string): string => {
  const h = Number(hhmm.slice(0, 2));
  return `${h % 12 || 12}:${hhmm.slice(3, 5)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const formatRange = (start: string, end: string): string => `${formatTime(start)} – ${formatTime(end)}`;

export const totalHours = (slots: Pick<SlotDraft, 'start' | 'end'>[]): number =>
  Math.round((slots.reduce((sum, s) => sum + (toMinutes(s.end) - toMinutes(s.start)), 0) / 60) * 10) / 10;

/** returns a readable message when two sessions of the same day overlap, otherwise null */
export const findOverlap = (slots: Pick<SlotDraft, 'day' | 'start' | 'end'>[]): string | null => {
  for (const day of DAY_ORDER) {
    const list = slots.filter((s) => s.day === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < list.length; i += 1) {
      if (toMinutes(list[i].start) < toMinutes(list[i - 1].end)) {
        return `${DAY_LONG[day]}: ${formatRange(list[i - 1].start, list[i - 1].end)} overlaps with ${formatRange(list[i].start, list[i].end)}`;
      }
    }
  }
  return null;
};

/** colours of the session types (live class = saffron, doubt hours = green, mentoring = gold, review = brown) */
export const KIND_STYLE: Record<SlotKind, { label: string; bar: string; chip: string }> = {
  'live-class': { label: 'Live class', bar: '#E8892B', chip: 'bg-[#FDE6C8] text-[#B25A0C]' },
  'office-hours': { label: 'Doubt-clearing hours', bar: '#3FA535', chip: 'bg-[#E4F4DC] text-[#2E7D32]' },
  mentoring: { label: '1:1 mentoring', bar: '#C58B2B', chip: 'bg-[#F7ECCB] text-[#8A5E0B]' },
  review: { label: 'Assignment review', bar: '#A0522D', chip: 'bg-[#F3DDD0] text-[#7C3A1B]' },
};

export const ROLE_LABEL: Record<InstructorRole, string> = {
  lead: 'Lead Instructor',
  instructor: 'Instructor',
  assistant: 'Teaching Assistant',
  guest: 'Guest Speaker',
};

export const ROLE_STYLE: Record<InstructorRole, string> = {
  lead: 'bg-gradient-to-r from-[#7A3E14] to-[#9A5521] text-ivory',
  instructor: 'bg-[#F7ECCB] text-[#8A5E0B]',
  assistant: 'bg-[#E4F4DC] text-[#2E7D32]',
  guest: 'bg-[#EFE6DA] text-veda-muted',
};