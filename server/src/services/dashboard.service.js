const { env } = require('../config/env');
const { COURSE_SEEDS } = require('../data/courses.seed');
const Course = require('../models/Course');
const StudentProgress = require('../models/StudentProgress');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const IST_OFFSET = 330 * 60 * 1000;

/** `dayOffset` days from today at hh:mm Indian time, as a Date */
const istAt = (dayOffset, hour, minute = 0) => {
  const ist = new Date(Date.now() + IST_OFFSET);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + dayOffset, hour, minute) - IST_OFFSET);
};

const titleOf = (slug) => (COURSE_SEEDS.find((c) => c.slug === slug) || {}).title || slug;

// ---------------------------------------------------------------------------------------------
// SAMPLE DATA (same people / courses as the design). Only used for a student who has no learning data yet,
// and only when DEMO_DASHBOARD is on. Dates are relative to "now", so "2 hours ago" always looks right.
// ---------------------------------------------------------------------------------------------
const buildDemoProgress = () => {
  const now = Date.now();
  const astrology = 'vedic-astrology-for-beginners';
  const gita = 'bhagavad-gita-in-depth-study';
  const mantra = 'mantra-science-and-healing';

  return {
    isDemo: true,
    enrollments: [
      { courseSlug: astrology, title: titleOf(astrology), totalLessons: 8, completedLessons: 5, currentModule: 'Module 4: Houses (Bhavas) in Astrology', nextLesson: 'Karma & Dharma (Module 2)', startedAt: new Date(now - 30 * DAY), lastActivityAt: new Date(now - 2 * HOUR) },
      { courseSlug: gita, title: titleOf(gita), totalLessons: 10, completedLessons: 0, currentModule: 'Module 1: Introduction to the Gita', nextLesson: 'The Battlefield of Kurukshetra (Module 1)', startedAt: new Date(now - 3 * HOUR), lastActivityAt: new Date(now - 3 * HOUR) },
      { courseSlug: mantra, title: titleOf(mantra), totalLessons: 20, completedLessons: 7, currentModule: 'Module 3: Beej Mantras', nextLesson: 'Beej Mantras: Practice (Module 3)', startedAt: new Date(now - 20 * DAY), lastActivityAt: new Date(now - 1 * DAY) },
    ],
    certificates: [
      { title: 'Introduction to Vedic Wisdom', lessons: 40, issuedAt: new Date(now - 3 * DAY) },
      { title: 'Foundations of Sanatan Dharma', lessons: 40, issuedAt: new Date(now - 60 * DAY) },
    ],
    assignments: [
      { title: 'Birth Chart Analysis (Module 4)', courseSlug: astrology, courseTitle: titleOf(astrology), dueAt: istAt(0, 20) },
      { title: 'Mantra Practice Journal (Week 3)', courseSlug: mantra, courseTitle: titleOf(mantra), dueAt: istAt(3, 20) },
    ],
    activity: [
      { type: 'lesson', title: 'Completed Lesson', subtitle: 'Module 3: Zodiac Signs (Rashis)', at: new Date(now - 2 * HOUR) },
      { type: 'live', title: 'Attended Live Class', subtitle: 'Mantra Science & Healing', at: new Date(now - 1 * DAY) },
      { type: 'assignment', title: 'Submitted Assignment', subtitle: 'Birth Chart Analysis (Module 4)', at: new Date(now - 2 * DAY) },
      { type: 'certificate', title: 'Earned Certificate', subtitle: 'Introduction to Vedic Wisdom', at: new Date(now - 3 * DAY) },
    ],
    liveClassesAttended: 12,
    liveClassesRegistered: 18,
  };
};

const getOrCreateProgress = async (userId) => {
  const existing = await StudentProgress.findOne({ user: userId });
  if (existing) return existing;
  const base = env.demoDashboard ? buildDemoProgress() : {};
  try {
    return await StudentProgress.create({ user: userId, ...base });
  } catch (err) {
    // two tabs opened the dashboard at the same moment: the other one created it first
    if (err && err.code === 11000) return StudentProgress.findOne({ user: userId });
    throw err;
  }
};

/** Used by the future checkout: put a purchased course on the student's dashboard. */
const addEnrollment = async (userId, courseSlug) => {
  const slug = String(courseSlug || '').toLowerCase();
  const course = (await Course.findOne({ slug, isActive: true }).lean()) || COURSE_SEEDS.find((c) => c.slug === slug);
  if (!course) return null;

  const progress = await getOrCreateProgress(userId);
  if (progress.enrollments.some((e) => e.courseSlug === slug)) return progress;
  progress.enrollments.push({ courseSlug: slug, title: course.title, totalLessons: course.lessons || 1 });
  await progress.save();
  return progress;
};

// ---------------------------------------------------------------------------------------------
// rounded down: 100% only when every lesson is really done (5 of 8 lessons = 62%)
const percent = (done, total) => (total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0);

const statusOf = (e) => {
  if (e.completedAt || (e.totalLessons > 0 && e.completedLessons >= e.totalLessons)) return 'completed';
  return e.completedLessons > 0 ? 'in-progress' : 'not-started';
};

const pickCourse = (c) => ({
  slug: c.slug,
  title: c.title,
  category: c.category,
  image: c.image || '',
  instructor: c.instructor || '',
  rating: c.rating || 0,
  studentsCount: c.studentsCount || 0,
  price: c.price,
  originalPrice: c.originalPrice,
  lessons: c.lessons,
});

const getDashboard = async (user) => {
  const progress = await getOrCreateProgress(user._id);

  let courses = await Course.find({ isActive: true }).sort({ order: 1 }).lean();
  if (!courses.length) courses = COURSE_SEEDS;
  const bySlug = new Map(courses.map((c) => [c.slug, c]));

  const enrollments = progress.enrollments
    .map((e) => {
      const course = bySlug.get(e.courseSlug);
      return {
        slug: e.courseSlug,
        title: (course && course.title) || e.title || e.courseSlug,
        category: (course && course.category) || '',
        image: (course && course.image) || '',
        instructor: (course && course.instructor) || '',
        totalLessons: e.totalLessons,
        completedLessons: Math.min(e.completedLessons, e.totalLessons),
        percent: percent(e.completedLessons, e.totalLessons),
        status: statusOf(e),
        currentModule: e.currentModule || '',
        nextLesson: e.nextLesson || '',
        startedAt: e.startedAt,
        lastActivityAt: e.lastActivityAt,
      };
    })
    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

  // lifetime numbers: finished (certificate) courses count too
  const certLessons = progress.certificates.reduce((sum, c) => sum + (c.lessons || 0), 0);
  const lessonsDone = enrollments.reduce((sum, e) => sum + e.completedLessons, 0) + certLessons;
  const lessonsTotal = enrollments.reduce((sum, e) => sum + e.totalLessons, 0) + certLessons;
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed').length;

  const enrolledSlugs = new Set(enrollments.map((e) => e.slug));
  const recommended = courses
    .filter((c) => !enrolledSlugs.has(c.slug))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.studentsCount || 0) - (a.studentsCount || 0))
    .slice(0, 4)
    .map(pickCourse);

  return {
    serverTime: new Date().toISOString(),
    user: { id: String(user._id), name: user.name, email: user.email },
    isDemo: Boolean(progress.isDemo),
    stats: {
      enrolled: enrollments.length,
      inProgress: enrollments.filter((e) => e.status === 'in-progress').length,
      liveClassesAttended: progress.liveClassesAttended,
      liveClassesRegistered: Math.max(progress.liveClassesRegistered, progress.liveClassesAttended),
      certificates: progress.certificates.length + completedEnrollments,
      overallPercent: percent(lessonsDone, lessonsTotal),
      lessonsDone,
      lessonsTotal,
    },
    enrollments,
    recommended,
    assignments: progress.assignments
      .filter((a) => !a.submittedAt)
      .sort((a, b) => a.dueAt - b.dueAt)
      .map((a) => ({ id: String(a._id), title: a.title, courseSlug: a.courseSlug, courseTitle: a.courseTitle, dueAt: a.dueAt })),
    activity: [...progress.activity]
      .sort((a, b) => b.at - a.at)
      .slice(0, 10)
      .map((a) => ({ type: a.type, title: a.title, subtitle: a.subtitle, at: a.at })),
  };
};

module.exports = { getDashboard, addEnrollment };