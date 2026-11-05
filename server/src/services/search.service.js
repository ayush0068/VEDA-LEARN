const Course = require('../models/Course');

const FIELDS =
  'slug title category image icon instructor description weeks lessons level language rating studentsCount price originalPrice badge order createdAt -_id';

// Topics people search for most. Only the ones that really match a course are shown,
// ordered by how many students those matching courses have (so "trending" follows real data).
const TRENDING_TERMS = [
  'Vedic Astrology',
  'Vastu Shastra',
  'Bhagavad Gita',
  'Mantra',
  'Yoga',
  'Meditation',
  'Ayurveda',
  'Sanatan',
  'Scriptures',
  'Healing',
];

const OVERVIEW_TTL_MS = 5 * 60 * 1000;
let overviewCache = null; // { at, data }

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenize = (q) => q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);

// ---------------------------------------------------------------------------------------------
// Live search: every word must match the title, description, teacher or category.
// Best matches first (title starts with > a word starts with > title contains > rest).
// ---------------------------------------------------------------------------------------------
const scoreCourse = (course, q, tokens) => {
  const title = (course.title || '').toLowerCase();
  const desc = (course.description || '').toLowerCase();
  const teacher = (course.instructor || '').toLowerCase();
  let score = 0;

  if (title === q) score += 200;
  else if (title.startsWith(q)) score += 120;
  else if (title.includes(q)) score += 70;

  tokens.forEach((token) => {
    if (title.startsWith(token)) score += 30;
    else if (title.includes(` ${token}`)) score += 22;
    else if (title.includes(token)) score += 14;
    if (teacher.includes(token)) score += 8;
    if (desc.includes(token)) score += 4;
  });

  return score + Math.min((course.studentsCount || 0) / 100000, 5) + (course.rating || 0) / 10;
};

const searchCourses = async (rawQuery, limit = 8) => {
  const q = rawQuery.trim().toLowerCase();
  const tokens = tokenize(q);
  if (tokens.length === 0) return { total: 0, items: [] };

  const filter = {
    isActive: true,
    $and: tokens.map((token) => {
      const regex = new RegExp(escapeRegex(token), 'i');
      return { $or: [{ title: regex }, { description: regex }, { instructor: regex }, { category: regex }] };
    }),
  };

  const found = await Course.find(filter).select(FIELDS).limit(50).lean();
  const items = found
    .map((course) => ({ course, score: scoreCourse(course, q, tokens) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.course);

  return { total: items.length, items: items.slice(0, limit) };
};

// ---------------------------------------------------------------------------------------------
// Overview shown before the person types: trending searches + suggested courses
// ---------------------------------------------------------------------------------------------
const buildOverview = async () => {
  const all = await Course.find({ isActive: true }).select(FIELDS).lean();

  const trending = TRENDING_TERMS.map((term) => {
    const needle = term.toLowerCase();
    const slugNeedle = needle.replace(/\s+/g, '-');
    const weight = all
      .filter((c) => {
        const text = `${c.title} ${c.description || ''}`.toLowerCase();
        return text.includes(needle) || (c.category || '').includes(slugNeedle);
      })
      .reduce((sum, c) => sum + (c.studentsCount || 0) + 1, 0);
    return { term, weight };
  })
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((entry) => entry.term);

  const suggested = [...all]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.studentsCount || 0) - (a.studentsCount || 0))
    .slice(0, 4);

  return { trending, suggested };
};

const getSearchOverview = async () => {
  if (overviewCache && Date.now() - overviewCache.at < OVERVIEW_TTL_MS) return overviewCache.data;
  const data = await buildOverview();
  overviewCache = { at: Date.now(), data };
  return data;
};

module.exports = { searchCourses, getSearchOverview };