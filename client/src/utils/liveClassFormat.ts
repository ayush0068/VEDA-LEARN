import type { LiveClass } from '@/constants/liveClasses';

const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};
const utcDate = (iso: string) => {
  const { y, m, d } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d));
};

/** "2026-10-31" -> "OCT" */
export const monthShort = (iso: string) =>
  utcDate(iso).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
/** "2026-11-01" -> "01" */
export const dayPadded = (iso: string) => String(parts(iso).d).padStart(2, '0');
/** "2026-10-25" -> "Sat" */
export const weekdayShort = (iso: string) => utcDate(iso).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
/** "2026-11-01" -> "Sat, 1 Nov 2026" */
export const formatClassDate = (iso: string) =>
  `${weekdayShort(iso)}, ${parts(iso).d} ${utcDate(iso).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} ${parts(iso).y}`;
/** "2026-10-25" -> "25 Oct" */
export const formatShortDate = (iso: string) =>
  `${parts(iso).d} ${utcDate(iso).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}`;

/** "18:00" -> "6:00 PM" */
export const formatClock = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};
export const formatTimeRange = (c: Pick<LiveClass, 'start' | 'end'>, withZone = false) =>
  `${formatClock(c.start)} – ${formatClock(c.end)}${withZone ? ' (IST)' : ''}`;

/** 500 -> "500+", 1200 -> "1.2K+" */
export const formatRegistered = (n: number) => {
  if (n < 1000) return `${n}+`;
  const k = n / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}K+`;
};

export const startHour = (c: Pick<LiveClass, 'start'>) => Number(c.start.split(':')[0]);

/** Sort key: date then start time */
export const classSortKey = (c: Pick<LiveClass, 'date' | 'start'>) => `${c.date}T${c.start}`;

// ---- calendar helpers (month = "YYYY-MM") ----
export const monthKey = (iso: string) => iso.slice(0, 7);
export const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
export const monthTitle = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
/** Weeks of the month, Sunday first; null = empty cell */
export const monthGrid = (key: string): (number | null)[] => {
  const [y, m] = key.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
};

// ---- "Add to calendar" (.ics, times converted from IST to UTC) ----
const icsStamp = (iso: string, hhmm: string) => {
  const { y, m, d } = parts(iso);
  const [h, min] = hhmm.split(':').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, h, min) - 330 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00Z`;
};
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export const buildIcs = (c: LiveClass, teacherName: string) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VedaLearn//Live Classes//EN',
    'BEGIN:VEVENT',
    `UID:${c.id}@vedalearn`,
    `DTSTAMP:${icsStamp(c.date, c.start)}`,
    `DTSTART:${icsStamp(c.date, c.start)}`,
    `DTEND:${icsStamp(c.date, c.end)}`,
    `SUMMARY:${icsEscape(c.title)}`,
    `DESCRIPTION:${icsEscape(`Live on ${c.platform} with ${teacherName}. Join: ${c.joinUrl}`)}`,
    `LOCATION:${icsEscape(c.joinUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

export const downloadIcs = (c: LiveClass, teacherName: string) => {
  const blob = new Blob([buildIcs(c, teacherName)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};