const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseContent = require('../models/CourseContent');
const CourseModule = require('../models/CourseModule');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const ApiError = require('../utils/ApiError');
const { removeUploadedFile } = require('../utils/media');

/**
 * Modules & Lessons of the courses (admin panel).
 *
 * Link with the website: after every change `syncCourse` copies the PUBLISHED modules / lessons into
 *   - Course.lessons              (number of lessons shown on the cards and the course page)
 *   - CourseContent.curriculum    (the "Curriculum" list of the Course Details page)
 * A course that has no published lesson yet keeps whatever was typed in the Courses page before.
 */

const idOf = (doc) => String(doc._id);
const isId = (value) => mongoose.isValidObjectId(value) && /^[a-f0-9]{24}$/i.test(String(value));
const MAX_TOPICS = 8;

// ------------------------------------------------------------------------------------------------
// shapes
// ------------------------------------------------------------------------------------------------
const toLesson = (l) => ({
  id: idOf(l),
  moduleId: String(l.module),
  title: l.title,
  description: l.description || '',
  type: l.type,
  mediaUrl: l.mediaUrl || '',
  content: l.content || '',
  durationMin: l.durationMin || 0,
  resources: (l.resources || []).map((r) => ({ title: r.title, url: r.url })),
  isPreview: Boolean(l.isPreview),
  order: l.order,
  status: l.status,
  updatedAt: l.updatedAt,
});

const toModule = (m, lessons) => {
  const list = lessons.map(toLesson);
  return {
    id: idOf(m),
    title: m.title,
    description: m.description || '',
    weeks: m.weeks || 1,
    order: m.order,
    status: m.status,
    lessons: list,
  };
};

const toCourseInfo = (c) => ({
  slug: c.slug,
  title: c.title,
  image: c.image || '',
  category: c.category,
  instructor: c.instructor || '',
  isActive: c.isActive !== false,
  lessonsOnSite: c.lessons ?? null,
  weeks: c.weeks ?? null,
});

const statsOf = (modules) => {
  const lessons = modules.flatMap((m) => m.lessons);
  const published = lessons.filter((l) => l.status === 'published' && modules.find((m) => m.id === l.moduleId)?.status === 'published');
  return {
    modules: modules.length,
    lessons: lessons.length,
    published: published.length,
    drafts: lessons.length - published.length,
    previews: lessons.filter((l) => l.isPreview).length,
    minutes: lessons.reduce((sum, l) => sum + l.durationMin, 0),
  };
};

// ------------------------------------------------------------------------------------------------
// read
// ------------------------------------------------------------------------------------------------
const findCourse = async (slug) => {
  const course = await Course.findOne({ slug: String(slug).toLowerCase() }).lean();
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
};

const findModule = async (id) => {
  if (!isId(id)) throw new ApiError(404, 'Module not found');
  const m = await CourseModule.findById(id);
  if (!m) throw new ApiError(404, 'Module not found');
  return m;
};

const findLesson = async (id) => {
  if (!isId(id)) throw new ApiError(404, 'Lesson not found');
  const l = await Lesson.findById(id);
  if (!l) throw new ApiError(404, 'Lesson not found');
  return l;
};

/** every course with the size of its curriculum (the course picker of the page) */
const listCourses = async () => {
  const [courses, moduleCounts, lessonCounts] = await Promise.all([
    Course.find().sort({ order: 1, createdAt: -1 }).select('slug title image category instructor isActive lessons weeks').lean(),
    CourseModule.aggregate([{ $group: { _id: '$courseSlug', modules: { $sum: 1 } } }]),
    Lesson.aggregate([
      {
        $group: {
          _id: '$courseSlug',
          lessons: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          minutes: { $sum: '$durationMin' },
        },
      },
    ]),
  ]);
  const mods = new Map(moduleCounts.map((r) => [r._id, r.modules]));
  const less = new Map(lessonCounts.map((r) => [r._id, r]));

  const items = courses.map((c) => ({
    ...toCourseInfo(c),
    modules: mods.get(c.slug) || 0,
    lessons: less.get(c.slug)?.lessons || 0,
    published: less.get(c.slug)?.published || 0,
    minutes: less.get(c.slug)?.minutes || 0,
  }));

  return {
    courses: items,
    stats: {
      courses: items.length,
      withContent: items.filter((c) => c.modules > 0).length,
      modules: items.reduce((n, c) => n + c.modules, 0),
      lessons: items.reduce((n, c) => n + c.lessons, 0),
    },
  };
};

const getCurriculum = async (slug) => {
  const course = await findCourse(slug);
  const [modules, lessons] = await Promise.all([
    CourseModule.find({ courseSlug: course.slug }).sort({ order: 1, createdAt: 1 }).lean(),
    Lesson.find({ courseSlug: course.slug }).sort({ order: 1, createdAt: 1 }).lean(),
  ]);
  const byModule = new Map();
  lessons.forEach((l) => {
    const key = String(l.module);
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key).push(l);
  });
  const shaped = modules.map((m) => toModule(m, byModule.get(idOf(m)) || []));
  return { course: toCourseInfo(course), modules: shaped, stats: statsOf(shaped) };
};

// ------------------------------------------------------------------------------------------------
// link with the website
// ------------------------------------------------------------------------------------------------
const syncCourse = async (slug) => {
  const modules = await CourseModule.find({ courseSlug: slug, status: 'published' }).sort({ order: 1, createdAt: 1 }).lean();
  if (modules.length === 0) return;
  const lessons = await Lesson.find({ courseSlug: slug, status: 'published', module: { $in: modules.map((m) => m._id) } })
    .sort({ order: 1, createdAt: 1 })
    .select('module title')
    .lean();

  const by = new Map();
  lessons.forEach((l) => {
    const key = String(l.module);
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(l.title);
  });

  const curriculum = modules
    .filter((m) => (by.get(idOf(m)) || []).length > 0)
    .map((m) => {
      const titles = by.get(idOf(m));
      return { title: m.title, lessons: titles.length, weeks: m.weeks || 1, topics: titles.slice(0, MAX_TOPICS).map((t) => t.slice(0, 120)) };
    });

  if (curriculum.length === 0) return; // nothing is published yet: leave the website as it is
  const total = curriculum.reduce((n, m) => n + m.lessons, 0);
  await Promise.all([
    Course.updateOne({ slug }, { $set: { lessons: total } }),
    CourseContent.updateOne({ slug }, { $set: { curriculum } }, { upsert: true }),
  ]);
};

/** the main file of a published lesson must exist, otherwise students would open an empty lesson */
const assertComplete = (lesson) => {
  if (lesson.status !== 'published') return;
  if (lesson.type === 'article' && !lesson.content) throw new ApiError(400, 'Write the lesson text before publishing it (or save it as a draft)');
  if (lesson.type === 'video' && !lesson.mediaUrl) throw new ApiError(400, 'Add the video before publishing the lesson (or save it as a draft)');
  if (lesson.type === 'document' && !lesson.mediaUrl) throw new ApiError(400, 'Upload the PDF before publishing the lesson (or save it as a draft)');
};

const nextOrder = async (Model, filter) => {
  const last = await Model.findOne(filter).sort({ order: -1 }).select('order').lean();
  return last ? last.order + 1 : 0;
};

// ------------------------------------------------------------------------------------------------
// modules
// ------------------------------------------------------------------------------------------------
const createModule = async (slug, fields) => {
  const course = await findCourse(slug);
  const order = await nextOrder(CourseModule, { courseSlug: course.slug });
  const m = await CourseModule.create({ ...fields, courseSlug: course.slug, order });
  await syncCourse(course.slug);
  return toModule(m, []);
};

const updateModule = async (id, patch) => {
  const m = await findModule(id);
  Object.assign(m, patch);
  await m.save();
  await syncCourse(m.courseSlug);
  const lessons = await Lesson.find({ module: m._id }).sort({ order: 1, createdAt: 1 }).lean();
  return toModule(m, lessons);
};

const removeLessonFiles = (lessons) => Promise.all(lessons.map((l) => removeUploadedFile(l.mediaUrl)));
const removeTicks = (lessons) => (lessons.length ? LessonProgress.deleteMany({ lesson: { $in: lessons.map((l) => l._id) } }) : null);

const deleteModule = async (id) => {
  const m = await findModule(id);
  const lessons = await Lesson.find({ module: m._id }).select('mediaUrl').lean();
  await removeTicks(lessons);
  await Promise.all([Lesson.deleteMany({ module: m._id }), CourseModule.deleteOne({ _id: m._id })]);
  await removeLessonFiles(lessons);
  await syncCourse(m.courseSlug);
  return { deleted: true, lessons: lessons.length };
};

const duplicateModule = async (id) => {
  const m = await findModule(id);
  const order = await nextOrder(CourseModule, { courseSlug: m.courseSlug });
  const copy = await CourseModule.create({ courseSlug: m.courseSlug, title: `${m.title} (Copy)`.slice(0, 120), description: m.description, weeks: m.weeks, order, status: 'draft' });
  const lessons = await Lesson.find({ module: m._id }).sort({ order: 1 }).lean();
  if (lessons.length) {
    await Lesson.insertMany(
      lessons.map((l, i) => ({
        courseSlug: l.courseSlug,
        module: copy._id,
        title: l.title,
        description: l.description,
        type: l.type,
        mediaUrl: l.mediaUrl,
        content: l.content,
        durationMin: l.durationMin,
        resources: l.resources,
        isPreview: l.isPreview,
        order: i,
        status: 'draft',
      })),
    );
  }
  const saved = await Lesson.find({ module: copy._id }).sort({ order: 1 }).lean();
  return toModule(copy, saved);
};

const reorderModules = async (slug, ids) => {
  const course = await findCourse(slug);
  const current = await CourseModule.find({ courseSlug: course.slug }).select('_id').lean();
  const known = new Set(current.map(idOf));
  if (ids.length !== known.size || ids.some((id) => !known.has(String(id)))) throw new ApiError(400, 'The module list changed. Please refresh the page.');
  await CourseModule.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
  await syncCourse(course.slug);
  return { ok: true };
};

// ------------------------------------------------------------------------------------------------
// lessons
// ------------------------------------------------------------------------------------------------
const createLesson = async (moduleId, fields) => {
  const m = await findModule(moduleId);
  assertComplete(fields);
  const order = await nextOrder(Lesson, { module: m._id });
  const l = await Lesson.create({ ...fields, courseSlug: m.courseSlug, module: m._id, order });
  await syncCourse(m.courseSlug);
  return toLesson(l);
};

const updateLesson = async (id, patch) => {
  const l = await findLesson(id);
  const oldMedia = l.mediaUrl;
  Object.assign(l, patch);
  assertComplete(l);
  await l.save();
  if (oldMedia && oldMedia !== l.mediaUrl) await removeUploadedFile(oldMedia);
  await syncCourse(l.courseSlug);
  return toLesson(l);
};

const deleteLesson = async (id) => {
  const l = await findLesson(id);
  await Lesson.deleteOne({ _id: l._id });
  await LessonProgress.deleteMany({ lesson: l._id });
  await removeUploadedFile(l.mediaUrl);
  await syncCourse(l.courseSlug);
  return { deleted: true };
};

const duplicateLesson = async (id) => {
  const l = await findLesson(id);
  const order = await nextOrder(Lesson, { module: l.module });
  const copy = await Lesson.create({
    courseSlug: l.courseSlug,
    module: l.module,
    title: `${l.title} (Copy)`.slice(0, 120),
    description: l.description,
    type: l.type,
    mediaUrl: l.mediaUrl,
    content: l.content,
    durationMin: l.durationMin,
    resources: l.resources,
    isPreview: l.isPreview,
    order,
    status: 'draft',
  });
  return toLesson(copy);
};

const reorderLessons = async (moduleId, ids) => {
  const m = await findModule(moduleId);
  const current = await Lesson.find({ module: m._id }).select('_id').lean();
  const known = new Set(current.map(idOf));
  if (ids.length !== known.size || ids.some((id) => !known.has(String(id)))) throw new ApiError(400, 'The lesson list changed. Please refresh the page.');
  await Lesson.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
  await syncCourse(m.courseSlug);
  return { ok: true };
};

/** moves a lesson to the end of another module of the same course */
const moveLesson = async (id, targetModuleId) => {
  const l = await findLesson(id);
  const target = await findModule(targetModuleId);
  if (target.courseSlug !== l.courseSlug) throw new ApiError(400, 'A lesson can only move inside its own course');
  if (String(l.module) !== idOf(target)) {
    l.module = target._id;
    l.order = await nextOrder(Lesson, { module: target._id });
    await l.save();
    await syncCourse(l.courseSlug);
  }
  return toLesson(l);
};

/** publish / unpublish many lessons or a whole module at once */
const setLessonsStatus = async (ids, status) => {
  const lessons = await Lesson.find({ _id: { $in: ids } });
  if (lessons.length === 0) throw new ApiError(404, 'Lessons not found');
  if (status === 'published') lessons.forEach((l) => assertComplete({ ...l.toObject(), status }));
  await Lesson.updateMany({ _id: { $in: lessons.map((l) => l._id) } }, { $set: { status } });
  await Promise.all([...new Set(lessons.map((l) => l.courseSlug))].map(syncCourse));
  return { updated: lessons.length };
};

const removeCourseCurriculum = async (slug) => {
  const lessons = await Lesson.find({ courseSlug: slug }).select('mediaUrl').lean();
  await LessonProgress.deleteMany({ courseSlug: slug });
  await Promise.all([Lesson.deleteMany({ courseSlug: slug }), CourseModule.deleteMany({ courseSlug: slug })]);
  await removeLessonFiles(lessons);
};

module.exports = {
  listCourses,
  getCurriculum,
  createModule,
  updateModule,
  deleteModule,
  duplicateModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  duplicateLesson,
  reorderLessons,
  moveLesson,
  setLessonsStatus,
  removeCourseCurriculum,
  syncCourse,
};