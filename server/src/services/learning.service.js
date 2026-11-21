const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const ApiError = require('../utils/ApiError');
const { getOrCreateProgress } = require('./dashboard.service');

/**
 * Student side of Modules & Lessons: the lesson player and lesson-wise progress.
 *
 * - Only PUBLISHED lessons of PUBLISHED modules are ever shown.
 * - A student must be enrolled (StudentProgress.enrollments) to open lessons; "free preview" lessons are open to every
 *   signed-in user, and admins can open everything (but cannot mark progress).
 * - Marking a lesson done / not done also refreshes the enrollment (percent, current module, next lesson, certificate),
 *   so the Student Dashboard always shows the real numbers.
 */

const idOf = (doc) => String(doc._id);
const isId = (value) => /^[a-f0-9]{24}$/i.test(String(value)) && mongoose.isValidObjectId(value);
const percentOf = (done, total) => (total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0);

const findCourse = async (slug) => {
  const course = await Course.findOne({ slug: String(slug || '').toLowerCase() }).select('slug title image category instructor isActive lessons price isFree').lean();
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
};

/** published modules (in order) that hold at least one published lesson, plus the flat lesson list */
const loadPublished = async (slug) => {
  const modules = await CourseModule.find({ courseSlug: slug, status: 'published' }).sort({ order: 1, createdAt: 1 }).lean();
  const lessons = modules.length
    ? await Lesson.find({ courseSlug: slug, status: 'published', module: { $in: modules.map((m) => m._id) } })
        .sort({ order: 1, createdAt: 1 })
        .lean()
    : [];

  const by = new Map();
  lessons.forEach((l) => {
    const key = String(l.module);
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(l);
  });

  const shaped = modules
    .map((m) => ({ ...m, lessons: by.get(idOf(m)) || [] }))
    .filter((m) => m.lessons.length > 0)
    .map((m, i) => ({ ...m, number: i + 1 }));
  return { modules: shaped, flat: shaped.flatMap((m) => m.lessons.map((l) => ({ lesson: l, module: m }))) };
};

const isAdmin = (user) => user.role === 'admin';
const isFreeCourse = (course) => course.isFree === true || course.price === 0;

/**
 * The student's enrollment in this course. For a FREE course any signed-in student is enrolled on the spot
 * (so the course shows up in My Courses and progress is saved); paid courses need a real enrollment.
 */
const ensureEnrollment = async (user, progress, course) => {
  const existing = progress.enrollments.find((e) => e.courseSlug === course.slug);
  if (existing || !isFreeCourse(course) || isAdmin(user)) return existing;
  progress.enrollments.push({ courseSlug: course.slug, title: course.title, totalLessons: Math.max(1, course.lessons || 1) });
  await progress.save();
  return progress.enrollments.find((e) => e.courseSlug === course.slug);
};

const doneIds = async (userId, slug) => new Set((await LessonProgress.find({ user: userId, courseSlug: slug }).select('lesson').lean()).map((p) => String(p.lesson)));

/** the lesson a student should open next: first unfinished one (after the last finished one if possible) */
const resumeLesson = (flat, done) => {
  if (!flat.length) return null;
  let lastDone = -1;
  flat.forEach((x, i) => done.has(idOf(x.lesson)) && (lastDone = i));
  const after = flat.slice(lastDone + 1).find((x) => !done.has(idOf(x.lesson)));
  return (after || flat.find((x) => !done.has(idOf(x.lesson))) || flat[flat.length - 1]).lesson;
};

/** copies the real numbers into the student's enrollment; returns true when something changed */
const applyToEnrollment = (progress, enrollment, course, flat, done, { now = new Date(), touch = false } = {}) => {
  const total = flat.length;
  const completed = flat.filter((x) => done.has(idOf(x.lesson))).length;
  const next = flat.find((x) => !done.has(idOf(x.lesson)));

  const before = JSON.stringify([enrollment.totalLessons, enrollment.completedLessons, enrollment.currentModule, enrollment.nextLesson, Boolean(enrollment.completedAt)]);
  enrollment.totalLessons = Math.max(1, total);
  enrollment.completedLessons = completed;
  enrollment.currentModule = next ? `Module ${next.module.number}: ${next.module.title}`.slice(0, 120) : '';
  enrollment.nextLesson = next ? `${next.lesson.title} (Module ${next.module.number})`.slice(0, 120) : '';
  if (touch) enrollment.lastActivityAt = now;

  const finished = total > 0 && completed >= total;
  if (finished && !enrollment.completedAt) {
    enrollment.completedAt = now;
    if (!progress.certificates.some((c) => c.title === course.title)) {
      progress.certificates.push({ title: course.title.slice(0, 120), lessons: total, issuedAt: now });
      progress.activity.push({ type: 'certificate', title: 'Earned Certificate', subtitle: course.title.slice(0, 160), at: now });
    }
  } else if (!finished && enrollment.completedAt) {
    enrollment.completedAt = undefined;
  }
  return touch || before !== JSON.stringify([enrollment.totalLessons, enrollment.completedLessons, enrollment.currentModule, enrollment.nextLesson, Boolean(enrollment.completedAt)]);
};

const summary = (flat, done) => {
  const completed = flat.filter((x) => done.has(idOf(x.lesson))).length;
  return { completed, total: flat.length, percent: percentOf(completed, flat.length) };
};

// ------------------------------------------------------------------------------------------------
/** the course outline for the player: modules, lessons (no media), what is finished, where to resume */
const getCourseLearning = async (user, slug) => {
  const course = await findCourse(slug);
  const progress = await getOrCreateProgress(user._id);
  const enrollment = await ensureEnrollment(user, progress, course);
  if (!enrollment && !isAdmin(user)) throw new ApiError(403, 'Enroll in this course to start learning');

  const { modules, flat } = await loadPublished(course.slug);
  const done = await doneIds(user._id, course.slug);

  if (enrollment && flat.length > 0 && applyToEnrollment(progress, enrollment, course, flat, done)) await progress.save();

  const resume = resumeLesson(flat, done);
  return {
    course: { slug: course.slug, title: course.title, image: course.image || '', category: course.category, instructor: course.instructor || '', isFree: isFreeCourse(course) },
    enrolled: Boolean(enrollment),
    hasCurriculum: flat.length > 0,
    progress: summary(flat, done),
    resumeLessonId: resume ? idOf(resume) : null,
    modules: modules.map((m) => ({
      id: idOf(m),
      number: m.number,
      title: m.title,
      description: m.description || '',
      lessons: m.lessons.map((l) => ({ id: idOf(l), title: l.title, type: l.type, durationMin: l.durationMin || 0, isPreview: Boolean(l.isPreview), completed: done.has(idOf(l)) })),
    })),
  };
};

/** one lesson with its content, plus the previous / next lesson */
const getLesson = async (user, id) => {
  if (!isId(id)) throw new ApiError(404, 'Lesson not found');
  const lesson = await Lesson.findById(id).lean();
  if (!lesson || lesson.status !== 'published') throw new ApiError(404, 'Lesson not found');

  const course = await findCourse(lesson.courseSlug);
  const { flat } = await loadPublished(course.slug);
  const at = flat.findIndex((x) => idOf(x.lesson) === idOf(lesson));
  if (at < 0) throw new ApiError(404, 'Lesson not found'); // its module is a draft

  const progress = await getOrCreateProgress(user._id);
  const enrolled = Boolean(await ensureEnrollment(user, progress, course));
  if (!enrolled && !isAdmin(user) && !lesson.isPreview) throw new ApiError(403, 'Enroll in this course to watch this lesson');

  const done = await doneIds(user._id, course.slug);
  const { module } = flat[at];
  return {
    course: { slug: course.slug, title: course.title },
    module: { id: idOf(module), number: module.number, title: module.title },
    lesson: {
      id: idOf(lesson),
      title: lesson.title,
      description: lesson.description || '',
      type: lesson.type,
      mediaUrl: lesson.mediaUrl || '',
      content: lesson.content || '',
      durationMin: lesson.durationMin || 0,
      resources: (lesson.resources || []).map((r) => ({ title: r.title, url: r.url })),
      isPreview: Boolean(lesson.isPreview),
      completed: done.has(idOf(lesson)),
    },
    prevId: at > 0 ? idOf(flat[at - 1].lesson) : null,
    nextId: at < flat.length - 1 ? idOf(flat[at + 1].lesson) : null,
    position: { index: at + 1, total: flat.length },
    canTrack: enrolled,
  };
};

/** mark a lesson done / not done and refresh the student's enrollment */
const setCompleted = async (user, id, completed) => {
  if (!isId(id)) throw new ApiError(404, 'Lesson not found');
  const lesson = await Lesson.findById(id).lean();
  if (!lesson || lesson.status !== 'published') throw new ApiError(404, 'Lesson not found');

  const course = await findCourse(lesson.courseSlug);
  const progress = await getOrCreateProgress(user._id);
  const enrollment = await ensureEnrollment(user, progress, course);
  if (!enrollment) throw new ApiError(403, 'Enroll in this course to track your progress');

  const { flat } = await loadPublished(course.slug);
  if (!flat.some((x) => idOf(x.lesson) === idOf(lesson))) throw new ApiError(404, 'Lesson not found');

  if (completed) {
    await LessonProgress.updateOne({ user: user._id, lesson: lesson._id }, { $set: { courseSlug: course.slug, completedAt: new Date() } }, { upsert: true });
  } else {
    await LessonProgress.deleteOne({ user: user._id, lesson: lesson._id });
  }

  const done = await doneIds(user._id, course.slug);
  const now = new Date();
  const wasFinished = Boolean(enrollment.completedAt);
  if (completed) {
    progress.activity.push({ type: 'lesson', title: 'Completed Lesson', subtitle: lesson.title.slice(0, 160), at: now });
    if (progress.activity.length > 50) progress.activity = progress.activity.slice(-50);
  }
  applyToEnrollment(progress, enrollment, course, flat, done, { now, touch: true });
  await progress.save();

  const next = flat.find((x) => !done.has(idOf(x.lesson)));
  return {
    completed: Boolean(completed),
    progress: summary(flat, done),
    nextLessonId: next ? idOf(next.lesson) : null,
    courseCompleted: Boolean(enrollment.completedAt) && !wasFinished,
  };
};

// ------------------------------------------------------------------------------------------------
// public (no login): what the course page on the website shows
// ------------------------------------------------------------------------------------------------
const findActiveCourse = async (slug) => {
  const course = await findCourse(slug);
  if (course.isActive === false) throw new ApiError(404, 'Course not found');
  return course;
};

/** modules and lessons (titles only, no media) with the free-preview ones marked */
const getPublicOutline = async (slug) => {
  const course = await findActiveCourse(slug);
  const { modules } = await loadPublished(course.slug);
  return {
    modules: modules.map((m) => ({
      id: idOf(m),
      number: m.number,
      title: m.title,
      lessons: m.lessons.map((l) => ({ id: idOf(l), title: l.title, type: l.type, durationMin: l.durationMin || 0, isPreview: Boolean(l.isPreview) })),
    })),
  };
};

/** a free-preview lesson, playable by anyone; any other lesson is refused */
const getPublicPreviewLesson = async (slug, id) => {
  const course = await findActiveCourse(slug);
  if (!isId(id)) throw new ApiError(404, 'Lesson not found');
  const { flat } = await loadPublished(course.slug);
  const hit = flat.find((x) => idOf(x.lesson) === String(id));
  if (!hit) throw new ApiError(404, 'Lesson not found');
  if (!hit.lesson.isPreview) throw new ApiError(403, 'Enroll in this course to watch this lesson');
  const l = hit.lesson;
  return {
    course: { slug: course.slug, title: course.title },
    module: { id: idOf(hit.module), number: hit.module.number, title: hit.module.title },
    lesson: {
      id: idOf(l),
      title: l.title,
      description: l.description || '',
      type: l.type,
      mediaUrl: l.mediaUrl || '',
      content: l.content || '',
      durationMin: l.durationMin || 0,
      resources: [],
      isPreview: true,
      completed: false,
    },
  };
};

module.exports = { getCourseLearning, getLesson, setCompleted, getPublicOutline, getPublicPreviewLesson };