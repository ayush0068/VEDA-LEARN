const { HIGHLIGHT_LABELS } = require('../config/courseOptions');
const { getDbState } = require('../config/db');
const Course = require('../models/Course');
const service = require('../services/adminCourse.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeMediaUrl } = require('../utils/media');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LIST_STATUSES = ['active', 'hidden', 'popular'];

// only plain strings are accepted (blocks query-operator injection)
const asString = (value) => (typeof value === 'string' ? value : '');
const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});
const objectOf = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const assertDb = () => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
};

const send = (res, data, status = 200) => {
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ success: true, data });
};

// ---- field cleaners (throw 400 with a readable message) ----
const text = (value, label, max, { required = false, min = 0 } = {}) => {
  const s = asString(value).trim().replace(/[ \t]+/g, ' ');
  if (required && !s) throw new ApiError(400, `${label} is required`);
  if (s && s.length < min) throw new ApiError(400, `${label} must be at least ${min} characters`);
  if (s.length > max) throw new ApiError(400, `${label} can be at most ${max} characters`);
  return s;
};

// '' / null -> null (= not set); otherwise a whole number inside the range
const whole = (value, label, { min = 0, max = 10000000, nullable = false } = {}) => {
  if (nullable && (value === '' || value === null)) return null;
  const n = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, `${label} must be a whole number between ${min} and ${max}`);
  return n;
};

const bool = (value, label) => {
  if (typeof value !== 'boolean') throw new ApiError(400, `${label} must be true or false`);
  return value;
};

// a file we uploaded (full link), a path inside client/public (/images/...) or any http(s) link
const url = (value, label) => {
  const s = asString(value).trim();
  if (!s) return '';
  if (s.length > 500) throw new ApiError(400, `${label} link is too long`);
  const ok = /^https?:\/\/[^\s]+$/i.test(s) || /^\/(?!\/)[^\s]*$/.test(s);
  if (!ok) throw new ApiError(400, `${label} must be a full link (https://...) or a path like /images/courses/name.png`);
  return normalizeMediaUrl(s);
};

const list = (value, label, { maxItems, maxLength }) => {
  if (!Array.isArray(value)) throw new ApiError(400, `${label} must be a list`);
  const items = [...new Set(value.map((v) => asString(v).trim().replace(/\s+/g, ' ')).filter(Boolean))];
  if (items.length > maxItems) throw new ApiError(400, `${label}: add at most ${maxItems} items`);
  if (items.some((v) => v.length > maxLength)) throw new ApiError(400, `${label}: each item can be at most ${maxLength} characters`);
  return items;
};

/** Course fields. On create `title`, `category` and `price` are required; on update only the fields sent are changed. */
const cleanCourse = (body, { create }) => {
  const f = {};
  const has = (key) => body[key] !== undefined;

  if (create && body.slug !== undefined && asString(body.slug).trim()) {
    const slug = asString(body.slug).trim().toLowerCase();
    if (slug.length > 100 || !SLUG_RE.test(slug)) throw new ApiError(400, 'URL name can only have small letters, numbers and hyphens');
    f.slug = slug;
  }

  if (create || has('title')) f.title = text(body.title, 'Course name', 120, { required: true, min: 3 });
  if (create || has('category')) {
    const category = asString(body.category).trim().toLowerCase();
    if (!/^[a-z0-9-]{1,60}$/.test(category)) throw new ApiError(400, 'Please choose a category');
    f.category = category;
  }
  // a free course has no price: any signed-in student can learn it without paying
  const free = has('isFree') ? bool(body.isFree, 'Free course') : undefined;
  if (free !== undefined) f.isFree = free;
  if (free) f.price = 0;
  else if (create || has('price')) {
    f.price = whole(body.price, 'Selling price');
    if (free === false && f.price === 0) throw new ApiError(400, 'A paid course needs a selling price above 0 (or switch it to Free)');
  }

  if (has('instructor')) f.instructor = text(body.instructor, 'Instructor name', 60);
  if (has('description')) f.description = text(body.description, 'Short description', 300);
  if (has('badge')) f.badge = text(body.badge, 'Badge', 24);
  if (has('language')) f.language = text(body.language, 'Language', 30) || 'English';
  if (has('level')) {
    const level = asString(body.level);
    if (!Course.LEVELS.includes(level)) throw new ApiError(400, 'Please choose a valid level');
    f.level = level;
  }

  if (has('weeks')) f.weeks = whole(body.weeks, 'Weeks', { min: 1, max: 200, nullable: true });
  if (has('lessons')) f.lessons = whole(body.lessons, 'Lessons', { min: 0, max: 5000, nullable: true });
  if (has('originalPrice')) f.originalPrice = free ? null : whole(body.originalPrice, 'Original price', { nullable: true });
  else if (free) f.originalPrice = null;
  if (has('studentsCount')) f.studentsCount = whole(body.studentsCount, 'Students', { max: 100000000 });
  if (has('order')) f.order = whole(body.order, 'Display order', { min: 0, max: 100000 });

  if (has('rating')) {
    const rating = typeof body.rating === 'string' && body.rating.trim() ? Number(body.rating) : body.rating;
    if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0 || rating > 5) throw new ApiError(400, 'Rating must be between 0 and 5');
    f.rating = Math.round(rating * 10) / 10;
  }

  if (has('isPopular')) f.isPopular = bool(body.isPopular, 'Popular');
  if (has('isActive')) f.isActive = bool(body.isActive, 'Visible');

  if (has('image')) f.image = url(body.image, 'Image');
  if (has('previewVideo')) f.previewVideo = url(body.previewVideo, 'Preview video');
  if (has('syllabus')) f.syllabus = url(body.syllabus, 'Syllabus');

  return f;
};

/** Content of the course page. Every part is optional: whatever is empty is generated automatically by the website. */
const cleanContent = (raw) => {
  const c = objectOf(raw);
  const i = objectOf(c.instructor);

  const highlights = Array.isArray(c.highlights) ? [...new Set(c.highlights.filter((k) => typeof k === 'string' && HIGHLIGHT_LABELS[k]))] : [];

  const curriculumRaw = c.curriculum === undefined ? [] : c.curriculum;
  if (!Array.isArray(curriculumRaw)) throw new ApiError(400, 'Curriculum must be a list');
  if (curriculumRaw.length > 30) throw new ApiError(400, 'Add at most 30 curriculum modules');
  const curriculum = curriculumRaw.map((m, n) => {
    const mod = objectOf(m);
    return {
      title: text(mod.title, `Module ${n + 1} title`, 120, { required: true }),
      lessons: whole(mod.lessons ?? 0, `Module ${n + 1} lessons`, { max: 1000 }),
      weeks: whole(mod.weeks ?? 1, `Module ${n + 1} weeks`, { min: 1, max: 100 }),
      topics: list(mod.topics ?? [], `Module ${n + 1} topics`, { maxItems: 30, maxLength: 120 }),
    };
  });

  const faqsRaw = c.faqs === undefined ? [] : c.faqs;
  if (!Array.isArray(faqsRaw)) throw new ApiError(400, 'FAQs must be a list');
  if (faqsRaw.length > 20) throw new ApiError(400, 'Add at most 20 FAQs');
  const faqs = faqsRaw.map((item, n) => {
    const faq = objectOf(item);
    return { q: text(faq.q, `FAQ ${n + 1} question`, 160, { required: true }), a: text(faq.a, `FAQ ${n + 1} answer`, 800, { required: true }) };
  });

  const rating = Number(i.rating ?? 0);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new ApiError(400, 'Instructor rating must be between 0 and 5');

  return {
    tagline: text(c.tagline, 'Tagline', 200),
    about: text(c.about, 'About text', 2000),
    tags: list(c.tags ?? [], 'Tags', { maxItems: 12, maxLength: 40 }),
    highlights,
    learn: list(c.learn ?? [], 'What you will learn', { maxItems: 20, maxLength: 160 }),
    audience: list(c.audience ?? [], 'Who is this course for', { maxItems: 12, maxLength: 160 }),
    curriculum,
    instructor: {
      title: text(i.title, 'Instructor title', 80),
      experience: text(i.experience, 'Instructor experience', 80),
      bio: text(i.bio, 'Instructor bio', 600),
      coursesConducted: whole(i.coursesConducted ?? 0, 'Courses conducted', { max: 100000 }),
      students: whole(i.students ?? 0, 'Instructor students', { max: 100000000 }),
      rating: Math.round(rating * 10) / 10,
    },
    ratingCount: whole(c.ratingCount ?? 0, 'Number of ratings', { max: 100000000 }),
    faqs,
    bannerTitle: text(c.bannerTitle, 'Banner title', 80),
  };
};

// ------------------------------------------------------------------------------------------------
// GET /api/admin/courses/options
const options = asyncHandler(async (_req, res) => {
  assertDb();
  send(res, await service.getOptions());
});

// GET /api/admin/courses?q=&category=&status=active|hidden|popular&sort=&page=&limit=
const listAll = asyncHandler(async (req, res) => {
  assertDb();
  const statusParam = asString(req.query.status);
  const [result, stats] = await Promise.all([
    service.listCourses({
      q: asString(req.query.q).trim().slice(0, 80),
      category: asString(req.query.category).trim().toLowerCase().slice(0, 60),
      status: LIST_STATUSES.includes(statusParam) ? statusParam : '',
      sort: asString(req.query.sort),
      page: Number.parseInt(asString(req.query.page), 10) || 1,
      limit: Number.parseInt(asString(req.query.limit), 10) || 9,
    }),
    service.getStats(),
  ]);
  send(res, { ...result, stats });
});

// GET /api/admin/courses/:slug  -> { course, content }
const details = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getCourseDetails(asString(req.params.slug)));
});

// POST /api/admin/courses   body: { title, category, price, ...course fields, content? }
const create = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const fields = cleanCourse(body, { create: true });
  const content = body.content === undefined ? undefined : cleanContent(body.content);
  send(res, await service.createCourse({ fields, content }), 201);
});

// PATCH /api/admin/courses/:slug   body: any course fields and/or content
const update = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const fields = cleanCourse(body, { create: false });
  const content = body.content === undefined ? undefined : cleanContent(body.content);
  if (Object.keys(fields).length === 0 && !content) throw new ApiError(400, 'Nothing to update');
  send(res, await service.updateCourse(asString(req.params.slug), { fields, content }));
});

// DELETE /api/admin/courses/:slug
const remove = asyncHandler(async (req, res) => {
  assertDb();
  await service.deleteCourse(asString(req.params.slug));
  send(res, { deleted: true });
});

module.exports = { options, listAll, details, create, update, remove };