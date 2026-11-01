import { LIVE_CLASSES, LIVE_TEACHERS, getLiveTeacher } from '@/constants/liveClasses';
import type { LiveClass, LiveStatus } from '@/constants/liveClasses';
import type { DashboardActivity, DashboardAssignment, DashboardEnrollment } from '@/types/dashboard';
import { classSortKey, formatClock, formatShortDate } from './liveClassFormat';

// All class times on the site are Indian Standard Time, so "today" and "now" are worked out in IST
// (the same answer as the device clock for students in India, and still correct anywhere else).
const IST_OFFSET_MS = 330 * 60 * 1000;
const p2 = (n: number) => String(n).padStart(2, '0');

/** ms -> the IST calendar date + clock */
export const istParts = (ms: number) => {
  const d = new Date(ms + IST_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return { y, m, d: day, h: d.getUTCHours(), min: d.getUTCMinutes(), iso: `${y}-${p2(m)}-${p2(day)}`, month: `${y}-${p2(m)}` };
};

export const todayIso = (now: number) => istParts(now).iso;

const classMs = (iso: string, hhmm: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, min) - IST_OFFSET_MS;
};
export const classStartMs = (c: Pick<LiveClass, 'date' | 'start'>) => classMs(c.date, c.start);
export const classEndMs = (c: Pick<LiveClass, 'date' | 'end'>) => classMs(c.date, c.end);

/** upcoming / ongoing / completed from the real clock (the static `status` in the data file is ignored) */
export const statusAt = (c: LiveClass, now: number): LiveStatus => {
  if (now >= classEndMs(c)) return 'completed';
  if (now >= classStartMs(c)) return 'ongoing';
  return 'upcoming';
};
export const withLiveStatus = (c: LiveClass, now: number): LiveClass => ({ ...c, status: statusAt(c, now) });

/** The class the student should see next: the one running now, otherwise the earliest still to start. */
export const nextLiveClass = (now: number, classes: LiveClass[] = LIVE_CLASSES): LiveClass | null => {
  const open = classes.filter((c) => statusAt(c, now) !== 'completed').sort((a, b) => classSortKey(a).localeCompare(classSortKey(b)));
  return open[0] ? withLiveStatus(open[0], now) : null;
};

export const classesOn = (iso: string, now: number, classes: LiveClass[] = LIVE_CLASSES): LiveClass[] =>
  classes
    .filter((c) => c.date === iso)
    .sort((a, b) => classSortKey(a).localeCompare(classSortKey(b)))
    .map((c) => withLiveStatus(c, now));

/** "2 hours ago", "1 day ago" ... */
export const timeAgo = (iso: string, now: number): string => {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const p = istParts(new Date(iso).getTime());
  return formatShortDate(p.iso);
};

export const clockOf = (ms: number) => {
  const p = istParts(ms);
  return formatClock(`${p2(p.h)}:${p2(p.min)}`);
};

// ---------------------------------------------------------------------------------------------
// Today's schedule (mobile): study slot + live classes + assignments due today, in time order
// ---------------------------------------------------------------------------------------------
export interface ScheduleItem {
  key: string;
  kind: 'lesson' | 'live' | 'assignment';
  sortMin: number;
  time: string; // "10:00 AM"
  title: string;
  subtitle: string;
  extra?: string;
  to: string;
  done?: boolean;
}

const STUDY_SLOT = { h: 10, min: 0 };

export const buildSchedule = (now: number, enrollments: DashboardEnrollment[], assignments: DashboardAssignment[]): ScheduleItem[] => {
  const today = todayIso(now);
  const items: ScheduleItem[] = [];

  const learning = enrollments.find((e) => e.status === 'in-progress' && e.nextLesson) ?? enrollments.find((e) => e.status === 'not-started');
  if (learning) {
    items.push({
      key: `lesson-${learning.slug}`,
      kind: 'lesson',
      sortMin: STUDY_SLOT.h * 60 + STUDY_SLOT.min,
      time: formatClock(`${p2(STUDY_SLOT.h)}:${p2(STUDY_SLOT.min)}`),
      title: 'Watch Lesson',
      subtitle: learning.nextLesson || learning.currentModule,
      extra: learning.title,
      to: `/courses/${learning.slug}`,
    });
  }

  classesOn(today, now).forEach((c) => {
    items.push({
      key: `live-${c.id}`,
      kind: 'live',
      sortMin: Number(c.start.slice(0, 2)) * 60 + Number(c.start.slice(3)),
      time: formatClock(c.start),
      title: 'Live Class',
      subtitle: c.title,
      extra: getLiveTeacher(c.teacherId).name,
      to: `/live-classes/${c.id}`,
      done: c.status === 'completed',
    });
  });

  assignments.forEach((a) => {
    const due = new Date(a.dueAt).getTime();
    const p = istParts(due);
    if (p.iso !== today) return;
    items.push({
      key: `assignment-${a.id}`,
      kind: 'assignment',
      sortMin: p.h * 60 + p.min,
      time: clockOf(due),
      title: 'Assignment Due',
      subtitle: a.title,
      extra: a.courseTitle,
      to: a.courseSlug ? `/courses/${a.courseSlug}` : '/dashboard/assignments',
      done: due < now,
    });
  });

  return items.sort((a, b) => a.sortMin - b.sortMin);
};

// ---------------------------------------------------------------------------------------------
// Learning calendar: dots per day
// ---------------------------------------------------------------------------------------------
export type CalendarKind = 'live' | 'assignment' | 'completed';

export interface CalendarEvent {
  kind: CalendarKind;
  title: string;
  time?: string;
  to?: string;
}

export const buildCalendarEvents = (
  now: number,
  assignments: DashboardAssignment[],
  activity: DashboardActivity[],
  classes: LiveClass[] = LIVE_CLASSES,
): Map<string, CalendarEvent[]> => {
  const map = new Map<string, CalendarEvent[]>();
  const add = (iso: string, e: CalendarEvent) => map.set(iso, [...(map.get(iso) ?? []), e]);

  classes.forEach((c) => {
    if (statusAt(c, now) === 'completed') return;
    add(c.date, { kind: 'live', title: c.title, time: formatClock(c.start), to: `/live-classes/${c.id}` });
  });
  assignments.forEach((a) => {
    const due = new Date(a.dueAt).getTime();
    add(istParts(due).iso, { kind: 'assignment', title: a.title, time: clockOf(due), to: a.courseSlug ? `/courses/${a.courseSlug}` : undefined });
  });
  activity.forEach((a) => {
    const at = new Date(a.at).getTime();
    add(istParts(at).iso, { kind: 'completed', title: `${a.title}: ${a.subtitle}`, time: clockOf(at) });
  });
  return map;
};

// ---------------------------------------------------------------------------------------------
// Notifications (bell)
// ---------------------------------------------------------------------------------------------
export interface DashNotification {
  id: string;
  title: string;
  text: string;
  to: string;
  /** sort order: lower = more urgent */
  rank: number;
}

export const buildNotifications = (now: number, assignments: DashboardAssignment[], activity: DashboardActivity[]): DashNotification[] => {
  const out: DashNotification[] = [];
  const today = todayIso(now);

  classesOn(today, now).forEach((c) => {
    if (c.status === 'ongoing') out.push({ id: `live-${c.id}-now`, title: 'Class is live now', text: c.title, to: `/live-classes/${c.id}`, rank: 0 });
    else if (c.status === 'upcoming') out.push({ id: `live-${c.id}`, title: `Live class today at ${formatClock(c.start)}`, text: c.title, to: `/live-classes/${c.id}`, rank: 1 });
  });

  assignments.forEach((a) => {
    const due = new Date(a.dueAt).getTime();
    const hoursLeft = (due - now) / 3_600_000;
    if (hoursLeft < -24) return;
    if (hoursLeft < 0) out.push({ id: `asg-${a.id}-late`, title: 'Assignment is overdue', text: a.title, to: '/dashboard/assignments', rank: 2 });
    else if (hoursLeft <= 48) out.push({ id: `asg-${a.id}`, title: `Assignment due ${istParts(due).iso === today ? `today, ${clockOf(due)}` : `on ${formatShortDate(istParts(due).iso)}`}`, text: a.title, to: '/dashboard/assignments', rank: 3 });
  });

  activity
    .filter((a) => a.type === 'certificate' && now - new Date(a.at).getTime() < 7 * 24 * 3_600_000)
    .forEach((a) => out.push({ id: `cert-${a.subtitle}`, title: 'Certificate earned', text: a.subtitle, to: '/dashboard/certificates', rank: 4 }));

  return out.sort((a, b) => a.rank - b.rank);
};

// ---------------------------------------------------------------------------------------------
// Small helpers shared by the dashboard sections
// ---------------------------------------------------------------------------------------------
/** The course for "Continue Learning": most recently used one that is under way, otherwise one not started yet. */
export const pickContinue = (enrollments: DashboardEnrollment[]): DashboardEnrollment | null =>
  enrollments.find((e) => e.status === 'in-progress') ?? enrollments.find((e) => e.status === 'not-started') ?? null;

/** teacher photo path from the teacher's name (the live-class teachers list); unknown names fall back to initials */
export const teacherAvatarSrc = (name: string): string => LIVE_TEACHERS_BY_NAME.get(name) ?? '/images/teachers/default.png';
const LIVE_TEACHERS_BY_NAME = new Map(LIVE_TEACHERS.map((t) => [t.name, t.avatar]));