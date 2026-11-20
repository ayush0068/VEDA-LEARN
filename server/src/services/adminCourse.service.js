const { COURSE_BADGES, COURSE_CATEGORIES, COURSE_LANGUAGES, HIGHLIGHT_LABELS } = require('../config/courseOptions');
const Course = require('../models/Course');
const CourseContent = require('../models/CourseContent');
const { removeCourseCurriculum } = require('./curriculum.service');
const InstructorProfile = require('../models/InstructorProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { removeUploadedFile } = require('../utils/media');

const PAGE_SIZES = [6, 9, 12, 24];
const MEDIA_FIELDS = ['image', 'previewVideo', 'syllabus'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  order: { order: 1, _id: 1 },
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const prettify = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ------------------------------------------------------------------------------------------------
// shapes sent to the admin panel
// ------------------------------------------------------------------------------------------------
const toCourse = (c) => ({
  slug: c.slug,
  title: c.title,
  category: c.category,
  image: c.image || '',
  previewVideo: c.previewVideo || '',
  syllabus: c.syllabus || '',
  instructor: c.instructor || '',
  description: c.description || '',
  weeks: c.weeks ?? null,
  lessons: c.lessons ?? null,
  level: c.level || 'All Levels',
  language: c.language || 'English',
  rating: c.rating || 0,
  studentsCount: c.studentsCount || 0,
  price: c.price,
  originalPrice: c.originalPrice ?? null,
  badge: c.badge || '',
  isPopular: Boolean(c.isPopular),
  isActive: c.isActive !== false,
  order: c.order || 0,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const toContent = (doc) => {
  const c = doc || {};
  const i = c.instructor || {};
  return {
    tagline: c.tagline || '',
    about: c.about || '',
    tags: c.tags || [],
    highlights: (c.highlights || []).map((h) => h.key),
    learn: c.learn || [],
    audience: c.audience || [],
    curriculum: (c.curriculum || []).map((m) => ({ title: m.title, lessons: m.lessons, weeks: m.weeks, topics: m.topics || [] })),
    instructor: {
      title: i.title || '',
      experience: i.experience || '',
      bio: i.bio || '',
      coursesConducted: i.coursesConducted || 0,
      students: i.students || 0,
      rating: i.rating || 0,
    },
    ratingCount: c.ratingCount || 0,
    faqs: (c.faqs || []).map((f) => ({ q: f.q, a: f.a })),
    bannerTitle: c.bannerTitle || '',
  };
};

// "empty" content = nothing typed in, so the website keeps using its automatic text
const isEmptyContent = (c) =>
  !c.tagline &&
  !c.about &&
  !c.bannerTitle &&
  !c.ratingCount &&
  [c.tags, c.highlights, c.learn, c.audience, c.curriculum, c.faqs].every((list) => list.length === 0) &&
  !c.instructor.title &&
  !c.instructor.experience &&
  !c.instructor.bio &&
  !c.instructor.coursesConducted &&
  !c.instructor.students &&
  !c.instructor.rating;

// ------------------------------------------------------------------------------------------------
// options / list / details
// ------------------------------------------------------------------------------------------------
const getOptions = async () => {
  const [usedCategories, courseTeachers, teacherUsers] = await Promise.all([
    Course.distinct('category'),
    Course.distinct('instructor'),
    User.find({ role: 'instructor', isActive: true }).select('name').lean(),
  ]);

  const known = new Set(COURSE_CATEGORIES.map((c) => c.value));
  const categories = [...COURSE_CATEGORIES, ...usedCategories.filter((s) => s && !known.has(s)).map((s) => ({ value: s, label: prettify(s) }))];
  const instructors = [...new Set([...teacherUsers.map((u) => u.name), ...courseTeachers].filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return {
    categories,
    levels: Course.LEVELS,
    languages: COURSE_LANGUAGES,
    badges: COURSE_BADGES,
    instructors,
    highlights: Object.entries(HIGHLIGHT_LABELS).map(([key, label]) => ({ key, label })),
  };
};

const getStats = async () => {
  const [total, active, popular] = await Promise.all([
    Course.countDocuments({}),
    Course.countDocuments({ isActive: { $ne: false } }),
    Course.countDocuments({ isPopular: true, isActive: { $ne: false } }),
  ]);
  return { total, active, hidden: total - active, popular };
};

const listCourses = async ({ q, category, status, sort, page, limit }) => {
  const pageSize = PAGE_SIZES.includes(limit) ? limit : 9;
  const filter = {};

  if (category) filter.category = category;
  if (status === 'active') filter.isActive = { $ne: false };
  if (status === 'hidden') filter.isActive = false;
  if (status === 'popular') Object.assign(filter, { isPopular: true, isActive: { $ne: false } });

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: regex }, { slug: regex }, { instructor: regex }, { description: regex }];
  }

  const total = await Course.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page || 1, 1), pages);

  const items = await Course.find(filter)
    .sort(SORTS[sort] || SORTS.order)
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { courses: items.map(toCourse), pagination: { page: current, pages, total, limit: pageSize } };
};

const findCourse = async (slug) => {
  const course = await Course.findOne({ slug: String(slug).toLowerCase() });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
};

const getCourseDetails = async (slug) => {
  const course = await findCourse(slug);
  const content = await CourseContent.findOne({ slug: course.slug }).lean();
  return { course: toCourse(course), content: toContent(content) };
};

// ------------------------------------------------------------------------------------------------
// write
// ------------------------------------------------------------------------------------------------
const assertPrices = (price, originalPrice) => {
  if (originalPrice != null && originalPrice < price) throw new ApiError(400, 'Original price must be higher than the selling price (or leave it empty)');
};

const saveContent = async (slug, content) => {
  if (isEmptyContent(content)) {
    await CourseContent.deleteOne({ slug });
    return;
  }
  const doc = { ...content, highlights: content.highlights.map((key) => ({ key, label: HIGHLIGHT_LABELS[key] })) };
  await CourseContent.updateOne({ slug }, { $set: doc }, { upsert: true, runValidators: true });
};

const uniqueSlug = async (base) => {
  const root = base || 'course';
  let slug = root;
  for (let n = 2; await Course.exists({ slug }); n += 1) slug = `${root}-${n}`.slice(0, 100);
  return slug;
};

const createCourse = async ({ fields, content }) => {
  assertPrices(fields.price, fields.originalPrice);

  let slug = fields.slug;
  if (slug) {
    if (await Course.exists({ slug })) throw new ApiError(409, 'A course with this URL name already exists');
  } else {
    slug = await uniqueSlug(slugify(fields.title));
  }

  if (fields.order === undefined) {
    const last = await Course.findOne({}).sort({ order: -1 }).select('order').lean();
    fields.order = (last?.order || 0) + 1;
  }

  const course = await Course.create({ ...fields, slug });
  if (content) await saveContent(slug, content);
  return getCourseDetails(course.slug);
};

const updateCourse = async (slug, { fields, content }) => {
  const course = await findCourse(slug);
  const replaced = MEDIA_FIELDS.filter((key) => fields[key] !== undefined && fields[key] !== course[key]).map((key) => course[key]);

  course.set(fields);
  if (fields.originalPrice === null) course.originalPrice = undefined;
  if (fields.weeks === null) course.weeks = undefined;
  if (fields.lessons === null) course.lessons = undefined;
  assertPrices(course.price, course.originalPrice);

  await course.save();
  if (content) await saveContent(course.slug, content);

  // the old picture / video / PDF is no longer used by this course
  await Promise.all(replaced.map(removeUploadedFile));
  return getCourseDetails(course.slug);
};

const deleteCourse = async (slug) => {
  const course = await findCourse(slug);
  await Promise.all([
    Course.deleteOne({ _id: course._id }),
    CourseContent.deleteOne({ slug: course.slug }),
    InstructorProfile.updateMany({ courses: course.slug }, { $pull: { courses: course.slug } }),
    removeCourseCurriculum(course.slug), // its modules and lessons go with it
  ]);
  await Promise.all(MEDIA_FIELDS.map((key) => removeUploadedFile(course[key])));
};

module.exports = { getOptions, getStats, listCourses, getCourseDetails, createCourse, updateCourse, deleteCourse };