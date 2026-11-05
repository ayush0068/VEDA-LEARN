import type { Course } from '@/types';

/** Topics shown as trending when the API is not reachable (same idea as the server list). */
const TRENDING_TERMS = ['Vedic Astrology', 'Vastu Shastra', 'Bhagavad Gita', 'Mantra', 'Yoga', 'Meditation', 'Ayurveda', 'Sanatan'];

const tokenize = (q: string): string[] => q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);

const score = (course: Course, q: string, tokens: string[]): number => {
  const title = course.title.toLowerCase();
  const desc = (course.description ?? '').toLowerCase();
  const teacher = (course.instructor ?? '').toLowerCase();
  let total = 0;

  if (title === q) total += 200;
  else if (title.startsWith(q)) total += 120;
  else if (title.includes(q)) total += 70;

  tokens.forEach((t) => {
    if (title.startsWith(t)) total += 30;
    else if (title.includes(` ${t}`)) total += 22;
    else if (title.includes(t)) total += 14;
    if (teacher.includes(t)) total += 8;
    if (desc.includes(t)) total += 4;
  });

  return total + Math.min(course.studentsCount / 100000, 5) + course.rating / 10;
};

/** Same rules as the server search; used when the API / database is unavailable. */
export const localSearch = (courses: Course[], rawQuery: string, limit = 8): Course[] => {
  const q = rawQuery.trim().toLowerCase();
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];

  return courses
    .filter((c) => {
      const hay = `${c.title} ${c.description ?? ''} ${c.instructor ?? ''} ${c.category}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    })
    .map((c) => ({ c, s: score(c, q, tokens) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.c);
};

export const localOverview = (courses: Course[]): { trending: string[]; suggested: Course[] } => {
  const trending = TRENDING_TERMS.map((term) => {
    const needle = term.toLowerCase();
    const weight = courses
      .filter((c) => `${c.title} ${c.description ?? ''}`.toLowerCase().includes(needle) || c.category.includes(needle.replace(/\s+/g, '-')))
      .reduce((sum, c) => sum + c.studentsCount + 1, 0);
    return { term, weight };
  })
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((x) => x.term);

  const suggested = [...courses].sort((a, b) => b.rating - a.rating || b.studentsCount - a.studentsCount).slice(0, 4);
  return { trending, suggested };
};

export interface Segment {
  text: string;
  hit: boolean;
}

/** Splits `text` so the parts that match the search words can be highlighted. */
export const highlightSegments = (text: string, query: string): Segment[] => {
  const words = tokenize(query).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) return [{ text, hit: false }];

  // split() with a capture group puts every match at an odd index
  return text
    .split(new RegExp(`(${words.join('|')})`, 'gi'))
    .map((part, i) => ({ text: part, hit: i % 2 === 1 }))
    .filter((seg) => seg.text !== '');
};

const RECENT_KEY = 'vedalearn_recent_searches';

export const readRecent = (): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
};

export const writeRecent = (list: string[]): void => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    /* storage unavailable */
  }
};