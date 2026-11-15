import { useEffect, useSyncExternalStore } from 'react';
import { runtimeTeachers } from '@/constants/liveClasses';
import type { LiveClass, LiveTeacher } from '@/constants/liveClasses';
import { getPublicLiveClass, getPublicLiveClasses } from '@/services/liveClass.service';
import type { PublicExtra } from '@/services/liveClass.service';
import type { StudentLiveClass } from '@/types/liveClass';

/**
 * Live classes created in the admin panel, shared by the Live Classes page, the class details,
 * the calendar and the student dashboard. Fetched from /api/live-classes/public and refreshed every 30 seconds.
 */

type ApiClass = StudentLiveClass & PublicExtra;

interface Snapshot {
  classes: LiveClass[];
  teachers: LiveTeacher[];
  loaded: boolean;
  error: string;
}

const REFRESH_MS = 30_000;
const PLACEHOLDER_IMG = '/images/live-classes/placeholder.png';
const PLACEHOLDER_AVATAR = '/images/teachers/default.png';

const IST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** ISO instant -> { date: "2026-11-20", time: "18:30" } in Indian Standard Time (the calendar and cards are IST) */
const inIst = (iso: string) => {
  const p = Object.fromEntries(IST.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
};

/** Maps a class from the server to the shape the Live Classes components already use. */
export const toLiveClass = (c: ApiClass, now = Date.now()): LiveClass | null => {
  if (c.status === 'cancelled') return null;
  if (c.status === 'scheduled' && new Date(c.endsAt).getTime() < now) return null; // never held
  const start = inIst(c.startsAt);
  const end = inIst(c.endsAt);
  const status = c.status === 'live' ? 'ongoing' : c.status === 'ended' ? 'completed' : 'upcoming';

  return {
    id: c.id,
    title: c.title,
    category: c.courseCategory || '',
    teacherId: c.host.id,
    level: 'All Levels',
    date: start.date,
    start: start.time,
    end: end.date === start.date ? end.time : '23:59',
    platform: 'VedaLearn',
    joinUrl: `/live/${c.id}`,
    recordingUrl: c.recordingUrl || undefined,
    registered: c.registered ?? 0,
    status,
    image: c.courseImage || PLACEHOLDER_IMG,
    tags: [c.courseTitle, c.features.recording ? 'Recorded' : ''].filter(Boolean),
    about: c.description || `Live class with ${c.host.name}.`,
    learn: [],
    opensAt: c.joinOpensAt,
    live: true,
  };
};

const teacherOf = (c: ApiClass): LiveTeacher => ({
  id: c.host.id,
  name: c.host.name,
  role: c.host.role === 'admin' ? 'Lead Teacher' : 'Instructor',
  years: '',
  bio: '',
  avatar: PLACEHOLDER_AVATAR,
  students: '',
  classes: '',
  rating: 0,
});

let snapshot: Snapshot = { classes: [], teachers: [], loaded: false, error: '' };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;
let timer = 0;

const publish = (next: Snapshot) => {
  snapshot = next;
  listeners.forEach((l) => l());
};

const applyList = (list: ApiClass[]) => {
  const now = Date.now();
  const classes = list.map((c) => toLiveClass(c, now)).filter((c): c is LiveClass => c !== null);
  const teachers = new Map<string, LiveTeacher>();
  list.forEach((c) => teachers.set(c.host.id, teacherOf(c)));
  teachers.forEach((t, id) => runtimeTeachers.set(id, t));
  publish({ classes, teachers: [...teachers.values()], loaded: true, error: '' });
};

export const refreshLiveClasses = (): Promise<void> => {
  if (inflight) return inflight;
  inflight = getPublicLiveClasses()
    .then((list) => applyList(list as ApiClass[]))
    .catch((e: unknown) => publish({ ...snapshot, loaded: true, error: e instanceof Error ? e.message : 'Could not load live classes' }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/** fetches one class (used when somebody opens a class link directly) */
export const loadLiveClass = async (id: string): Promise<LiveClass | null> => {
  const c = await getPublicLiveClass(id);
  runtimeTeachers.set(c.host.id, teacherOf(c));
  return toLiveClass(c) ?? null;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  if (listeners.size === 1) {
    void refreshLiveClasses();
    timer = window.setInterval(() => !document.hidden && void refreshLiveClasses(), REFRESH_MS);
  }
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) window.clearInterval(timer);
  };
};

/** current classes without subscribing (for helpers that are not components) */
export const liveClassSnapshot = (): LiveClass[] => snapshot.classes;

/** { classes, teachers, loaded, error, reload } - the component re-renders whenever the list changes */
export function useLiveClassData() {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  useEffect(() => {
    // coming back to the tab: show the latest right away
    const onVisible = () => !document.hidden && void refreshLiveClasses();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  return { ...snap, reload: refreshLiveClasses };
}