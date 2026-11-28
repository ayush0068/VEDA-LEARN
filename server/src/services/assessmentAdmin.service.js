const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProgress = require('../models/StudentProgress');
const Submission = require('../models/Submission');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { normalizeMediaUrl } = require('../utils/media');
const { totalPoints, norm } = require('../utils/quizScoring');

/** Quizzes & Assignments (admin panel): build quizzes, set assignments, read the results, grade the hand-ins. */

const ObjectId = mongoose.Types.ObjectId;
const idOf = (doc) => String(doc._id);
const isId = (value) => /^[a-f0-9]{24}$/i.test(String(value)) && mongoose.isValidObjectId(value);
const STATUSES = ['draft', 'published', 'archived'];
const SUBMISSION_TYPES = ['text', 'file', 'link'];

// ---------------------------------------------------------------------------------------------
// cleaning what the admin sends
// ---------------------------------------------------------------------------------------------
const asString = (v) => (typeof v === 'string' ? v : '');
const has = (body, key) => Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined;

const text = (value, label, max, { required = false, multiline = false } = {}) => {
  let s = asString(value).trim();
  if (!multiline) s = s.replace(/\s+/g, ' ');
  if (required && !s) throw new ApiError(400, `${label} is required`);
  if (s.length > max) throw new ApiError(400, `${label} must be at most ${max} characters`);
  return s;
};

const int = (value, label, min, max) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, `${label} must be a whole number from ${min} to ${max}`);
  return n;
};

const date = (value, label) => {
  if (value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `${label} is not a valid date`);
  return d;
};

const link = (value, label) => {
  const s = asString(value).trim();
  if (!s) return '';
  if (s.length > 600) throw new ApiError(400, `${label} is too long`);
  if (!/^(https?:\/\/|\/)/i.test(s)) throw new ApiError(400, `${label} must be a link starting with http(s)://`);
  return normalizeMediaUrl(s);
};

const keepId = (value) => (isId(value) ? new ObjectId(String(value)) : new ObjectId());

const cleanQuestion = (raw, n) => {
  if (!raw || typeof raw !== 'object') throw new ApiError(400, `Question ${n} is not valid`);
  const label = `Question ${n}`;
  const type = asString(raw.type);
  if (!['single', 'multiple', 'truefalse', 'short'].includes(type)) throw new ApiError(400, `${label}: choose a question type`);
  const q = {
    _id: keepId(raw._id || raw.id),
    type,
    text: text(raw.text, `${label} text`, 1000, { required: true, multiline: true }),
    image: link(raw.image, `${label} image`),
    points: int(raw.points === undefined || raw.points === '' ? 1 : raw.points, `${label} points`, 1, 100),
    explanation: text(raw.explanation, `${label} explanation`, 1000, { multiline: true }),
    options: [],
    acceptedAnswers: [],
  };

  if (type === 'short') {
    const list = (Array.isArray(raw.acceptedAnswers) ? raw.acceptedAnswers : []).map((a) => text(a, `${label} answer`, 200)).filter(Boolean);
    const unique = [...new Map(list.map((a) => [norm(a), a])).values()];
    if (!unique.length) throw new ApiError(400, `${label}: add at least one accepted answer`);
    if (unique.length > 10) throw new ApiError(400, `${label}: at most 10 accepted answers`);
    q.acceptedAnswers = unique;
    return q;
  }

  let options = (Array.isArray(raw.options) ? raw.options : []).map((o) => ({
    _id: keepId(o && (o._id || o.id)),
    text: text(o && o.text, `${label} option`, 300),
    correct: Boolean(o && o.correct),
  }));
  if (type === 'truefalse') {
    const rightIsTrue = options.length ? Boolean((options[0] || {}).correct) : true;
    options = [
      { _id: options[0] ? options[0]._id : new ObjectId(), text: 'True', correct: rightIsTrue },
      { _id: options[1] ? options[1]._id : new ObjectId(), text: 'False', correct: !rightIsTrue },
    ];
  }
  if (options.some((o) => !o.text)) throw new ApiError(400, `${label}: every option needs some text`);
  if (options.length < 2) throw new ApiError(400, `${label}: add at least 2 options`);
  if (options.length > 8) throw new ApiError(400, `${label}: at most 8 options`);
  const rightCount = options.filter((o) => o.correct).length;
  if (type === 'single' && rightCount !== 1) throw new ApiError(400, `${label}: mark exactly one correct option`);
  if (type === 'multiple' && rightCount < 1) throw new ApiError(400, `${label}: mark at least one correct option`);
  if (new Set(options.map((o) => norm(o.text))).size !== options.length) throw new ApiError(400, `${label}: two options have the same text`);
  q.options = options;
  return q;
};

const cleanCommon = (body, { create }) => {
  const out = {};
  if (create || has(body, 'title')) out.title = text(body.title, 'Title', 140, { required: true });
  if (create || has(body, 'description')) out.description = text(body.description, 'Description', create ? 1000 : 5000, { multiline: true });
  if (has(body, 'status')) {
    if (!STATUSES.includes(body.status)) throw new ApiError(400, 'Status must be draft, published or archived');
    out.status = body.status;
  }
  return out;
};

const cleanQuiz = (body, { create }) => {
  const out = cleanCommon(body, { create });
  if (has(body, 'description')) out.description = text(body.description, 'Description', 1000, { multiline: true });
  if (has(body, 'timeLimitMin')) out.timeLimitMin = int(body.timeLimitMin, 'Time limit', 0, 600);
  if (has(body, 'passPercent')) out.passPercent = int(body.passPercent, 'Pass mark', 0, 100);
  if (has(body, 'maxAttempts')) out.maxAttempts = int(body.maxAttempts, 'Attempts', 0, 50);
  if (has(body, 'shuffleQuestions')) out.shuffleQuestions = Boolean(body.shuffleQuestions);
  if (has(body, 'shuffleOptions')) out.shuffleOptions = Boolean(body.shuffleOptions);
  if (has(body, 'showAnswers')) {
    if (!['after_submit', 'after_pass', 'never'].includes(body.showAnswers)) throw new ApiError(400, 'Choose when answers are shown');
    out.showAnswers = body.showAnswers;
  }
  if (has(body, 'availableFrom')) out.availableFrom = date(body.availableFrom, 'Opens on');
  if (has(body, 'availableUntil')) out.availableUntil = date(body.availableUntil, 'Closes on');
  if (out.availableFrom && out.availableUntil && out.availableUntil <= out.availableFrom) throw new ApiError(400, 'The closing date must be after the opening date');
  if (has(body, 'questions')) {
    if (!Array.isArray(body.questions)) throw new ApiError(400, 'Questions must be a list');
    if (body.questions.length > 100) throw new ApiError(400, 'A quiz can have at most 100 questions');
    out.questions = body.questions.map((q, i) => cleanQuestion(q, i + 1));
  }
  return out;
};

const cleanAssignment = (body, { create }) => {
  const out = cleanCommon(body, { create });
  if (has(body, 'description')) out.description = text(body.description, 'Instructions', 5000, { multiline: true });
  if (has(body, 'dueAt')) out.dueAt = date(body.dueAt, 'Due date');
  if (has(body, 'maxPoints')) out.maxPoints = int(body.maxPoints, 'Points', 1, 1000);
  if (has(body, 'allowLate')) out.allowLate = Boolean(body.allowLate);
  if (has(body, 'maxFiles')) out.maxFiles = int(body.maxFiles, 'Files', 1, 10);
  if (has(body, 'submissionTypes')) {
    const list = [...new Set((Array.isArray(body.submissionTypes) ? body.submissionTypes : []).filter((t) => SUBMISSION_TYPES.includes(t)))];
    if (!list.length) throw new ApiError(400, 'Choose at least one way to hand in (text, file or link)');
    out.submissionTypes = list;
  }
  if (has(body, 'resources')) {
    const list = Array.isArray(body.resources) ? body.resources : [];
    if (list.length > 10) throw new ApiError(400, 'At most 10 resources');
    out.resources = list.map((r) => ({ title: text(r && r.title, 'Resource name', 120, { required: true }), url: link(r && r.url, 'Resource link') })).filter((r) => r.url);
  }
  return out;
};

// ---------------------------------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------------------------------
const toQuestion = (q) => ({
  id: idOf(q),
  type: q.type,
  text: q.text,
  image: q.image || '',
  points: q.points || 1,
  explanation: q.explanation || '',
  acceptedAnswers: q.acceptedAnswers || [],
  options: (q.options || []).map((o) => ({ id: idOf(o), text: o.text, correct: Boolean(o.correct) })),
});

const toQuizFull = (quiz) => ({
  id: idOf(quiz),
  courseSlug: quiz.courseSlug,
  courseTitle: quiz.courseTitle || '',
  title: quiz.title,
  description: quiz.description || '',
  status: quiz.status,
  timeLimitMin: quiz.timeLimitMin || 0,
  passPercent: quiz.passPercent,
  maxAttempts: quiz.maxAttempts || 0,
  shuffleQuestions: Boolean(quiz.shuffleQuestions),
  shuffleOptions: Boolean(quiz.shuffleOptions),
  showAnswers: quiz.showAnswers,
  availableFrom: quiz.availableFrom || null,
  availableUntil: quiz.availableUntil || null,
  questions: (quiz.questions || []).map(toQuestion),
  questionCount: (quiz.questions || []).length,
  totalPoints: totalPoints(quiz),
  createdAt: quiz.createdAt,
  updatedAt: quiz.updatedAt,
});

const toAssignment = (a) => ({
  id: idOf(a),
  courseSlug: a.courseSlug,
  courseTitle: a.courseTitle || '',
  title: a.title,
  description: a.description || '',
  status: a.status,
  dueAt: a.dueAt || null,
  maxPoints: a.maxPoints,
  allowLate: a.allowLate !== false,
  submissionTypes: a.submissionTypes || ['text', 'file'],
  maxFiles: a.maxFiles || 3,
  resources: (a.resources || []).map((r) => ({ title: r.title, url: r.url })),
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

const courseFor = async (slug) => {
  const course = await Course.findOne({ slug: asString(slug).toLowerCase() }).select('slug title').lean();
  if (!course) throw new ApiError(400, 'Choose a course');
  return course;
};

// ---------------------------------------------------------------------------------------------
// overview + course picker
// ---------------------------------------------------------------------------------------------
const listCourses = async () => {
  const courses = await Course.find({}).sort({ order: 1, title: 1 }).select('slug title').lean();
  return courses.map((c) => ({ slug: c.slug, title: c.title }));
};

const people = async (ids) => {
  const unique = [...new Set(ids.map(String))];
  if (!unique.length) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select('name email').lean();
  return new Map(users.map((u) => [idOf(u), { name: u.name || u.email || 'Student', email: u.email || '' }]));
};

const getOverview = async () => {
  const [quizzes, assignments, attempts, pending, recent] = await Promise.all([
    Quiz.find({}).select('status').lean(),
    Assignment.find({}).select('status').lean(),
    QuizAttempt.find({ status: 'submitted' }).select('percent passed').lean(),
    Submission.countDocuments({ status: 'submitted' }),
    Submission.find({ status: 'submitted' }).sort({ submittedAt: -1 }).limit(6).lean(),
  ]);
  const count = (list, s) => list.filter((x) => x.status === s).length;
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.percent || 0), 0) / attempts.length) : 0;
  const who = await people(recent.map((r) => r.user));
  const titles = new Map((await Assignment.find({ _id: { $in: recent.map((r) => r.assignment) } }).select('title').lean()).map((a) => [idOf(a), a.title]));
  return {
    quizzes: { total: quizzes.length, published: count(quizzes, 'published'), draft: count(quizzes, 'draft'), archived: count(quizzes, 'archived') },
    assignments: { total: assignments.length, published: count(assignments, 'published'), draft: count(assignments, 'draft'), archived: count(assignments, 'archived') },
    attempts: { total: attempts.length, avgPercent: avg, passRate: attempts.length ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100) : 0 },
    needsGrading: pending,
    recentSubmissions: recent.map((r) => ({
      id: idOf(r),
      assignmentId: String(r.assignment),
      assignmentTitle: titles.get(String(r.assignment)) || 'Assignment',
      student: (who.get(String(r.user)) || { name: 'Student' }).name,
      submittedAt: r.submittedAt,
      late: Boolean(r.late),
    })),
  };
};

// ---------------------------------------------------------------------------------------------
// quizzes
// ---------------------------------------------------------------------------------------------
const listQuizzes = async ({ courseSlug, status, q } = {}) => {
  const filter = {};
  if (courseSlug) filter.courseSlug = asString(courseSlug).toLowerCase();
  if (STATUSES.includes(status)) filter.status = status;
  let quizzes = await Quiz.find(filter).sort({ updatedAt: -1 }).lean();
  const needle = norm(q);
  if (needle) quizzes = quizzes.filter((x) => norm(`${x.title} ${x.courseTitle}`).includes(needle));

  const attempts = quizzes.length ? await QuizAttempt.find({ quiz: { $in: quizzes.map((x) => x._id) }, status: 'submitted' }).select('quiz percent passed user').lean() : [];
  const stats = new Map();
  attempts.forEach((a) => {
    const s = stats.get(String(a.quiz)) || { attempts: 0, sum: 0, passed: 0, students: new Set() };
    s.attempts += 1;
    s.sum += a.percent || 0;
    s.passed += a.passed ? 1 : 0;
    s.students.add(String(a.user));
    stats.set(String(a.quiz), s);
  });
  return quizzes.map((x) => {
    const s = stats.get(idOf(x));
    return {
      id: idOf(x),
      courseSlug: x.courseSlug,
      courseTitle: x.courseTitle || '',
      title: x.title,
      status: x.status,
      questionCount: (x.questions || []).length,
      totalPoints: totalPoints(x),
      timeLimitMin: x.timeLimitMin || 0,
      passPercent: x.passPercent,
      maxAttempts: x.maxAttempts || 0,
      attempts: s ? s.attempts : 0,
      students: s ? s.students.size : 0,
      avgPercent: s ? Math.round(s.sum / s.attempts) : 0,
      passRate: s ? Math.round((s.passed / s.attempts) * 100) : 0,
      updatedAt: x.updatedAt,
    };
  });
};

const findQuiz = async (id) => {
  if (!isId(id)) throw new ApiError(404, 'Quiz not found');
  const quiz = await Quiz.findById(id);
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  return quiz;
};

const assertPublishable = (quiz) => {
  if (quiz.status === 'published' && !(quiz.questions || []).length) throw new ApiError(400, 'Add at least one question before publishing');
};

const getQuiz = async (id) => toQuizFull(await findQuiz(id));

const createQuiz = async (body, admin) => {
  const data = cleanQuiz(body, { create: true });
  const course = await courseFor(body.courseSlug);
  assertPublishable({ status: data.status, questions: data.questions });
  const quiz = await Quiz.create({
    passPercent: 60,
    showAnswers: 'after_submit',
    questions: [],
    ...data,
    courseSlug: course.slug,
    courseTitle: course.title,
    status: data.status || 'draft',
    createdBy: admin._id,
  });
  return toQuizFull(quiz);
};

const updateQuiz = async (id, body) => {
  const quiz = await findQuiz(id);
  const data = cleanQuiz(body, { create: false });
  if (has(body, 'courseSlug') && asString(body.courseSlug).toLowerCase() !== quiz.courseSlug) {
    const course = await courseFor(body.courseSlug);
    quiz.courseSlug = course.slug;
    quiz.courseTitle = course.title;
  }
  Object.entries(data).forEach(([k, v]) => {
    quiz[k] = v;
  });
  assertPublishable(quiz);
  if (quiz.availableFrom && quiz.availableUntil && new Date(quiz.availableUntil) <= new Date(quiz.availableFrom)) throw new ApiError(400, 'The closing date must be after the opening date');
  await quiz.save();
  return toQuizFull(quiz);
};

const deleteQuiz = async (id) => {
  const quiz = await findQuiz(id);
  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await Quiz.deleteOne({ _id: quiz._id });
  return { id: idOf(quiz) };
};

const duplicateQuiz = async (id, admin) => {
  const src = toQuizFull(await findQuiz(id));
  const copy = await Quiz.create({
    courseSlug: src.courseSlug,
    courseTitle: src.courseTitle,
    title: `${src.title} (copy)`.slice(0, 140),
    description: src.description,
    status: 'draft',
    timeLimitMin: src.timeLimitMin,
    passPercent: src.passPercent,
    maxAttempts: src.maxAttempts,
    shuffleQuestions: src.shuffleQuestions,
    shuffleOptions: src.shuffleOptions,
    showAnswers: src.showAnswers,
    availableFrom: null,
    availableUntil: null,
    questions: src.questions.map((q) => cleanQuestion({ ...q, _id: undefined, id: undefined, options: q.options.map((o) => ({ ...o, id: undefined })) }, 1)),
    createdBy: admin._id,
  });
  return toQuizFull(copy);
};

const getQuizAnalytics = async (id) => {
  const quiz = await findQuiz(id);
  const attempts = await QuizAttempt.find({ quiz: quiz._id, status: 'submitted' }).sort({ submittedAt: -1 }).lean();
  const who = await people(attempts.map((a) => a.user));
  const n = attempts.length;

  const distribution = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i === 9 ? 100 : i * 10 + 9, count: 0 }));
  attempts.forEach((a) => {
    distribution[Math.min(9, Math.floor((a.percent || 0) / 10))].count += 1;
  });

  const questions = (quiz.questions || []).map((q, i) => {
    const qid = idOf(q);
    let answered = 0;
    let correct = 0;
    const picks = new Map();
    attempts.forEach((a) => {
      const ans = (a.answers || []).find((x) => String(x.question) === qid);
      if (!ans) return;
      answered += 1;
      if (ans.correct) correct += 1;
      (ans.selected || []).forEach((o) => picks.set(o, (picks.get(o) || 0) + 1));
    });
    return {
      id: qid,
      number: i + 1,
      text: q.text,
      type: q.type,
      answered,
      skipped: n - answered,
      correct,
      correctRate: n ? Math.round((correct / n) * 100) : 0,
      options: (q.options || []).map((o) => ({ id: idOf(o), text: o.text, correct: Boolean(o.correct), picked: picks.get(idOf(o)) || 0 })),
    };
  });

  const best = new Map();
  attempts.forEach((a) => {
    const cur = best.get(String(a.user));
    if (!cur || a.percent > cur.percent || (a.percent === cur.percent && a.timeTakenSec < cur.timeTakenSec)) best.set(String(a.user), a);
  });
  const row = (a) => ({ id: idOf(a), student: (who.get(String(a.user)) || { name: 'Student' }).name, email: (who.get(String(a.user)) || {}).email || '', attemptNo: a.attemptNo, percent: a.percent, score: a.score, total: a.total, passed: Boolean(a.passed), timeTakenSec: a.timeTakenSec || 0, submittedAt: a.submittedAt });

  return {
    quiz: { id: idOf(quiz), title: quiz.title, courseTitle: quiz.courseTitle, passPercent: quiz.passPercent, questionCount: (quiz.questions || []).length },
    summary: {
      attempts: n,
      students: new Set(attempts.map((a) => String(a.user))).size,
      avgPercent: n ? Math.round(attempts.reduce((s, a) => s + a.percent, 0) / n) : 0,
      passRate: n ? Math.round((attempts.filter((a) => a.passed).length / n) * 100) : 0,
      highest: n ? Math.max(...attempts.map((a) => a.percent)) : 0,
      lowest: n ? Math.min(...attempts.map((a) => a.percent)) : 0,
      avgTimeSec: n ? Math.round(attempts.reduce((s, a) => s + (a.timeTakenSec || 0), 0) / n) : 0,
    },
    distribution,
    questions,
    leaderboard: [...best.values()].sort((a, b) => b.percent - a.percent || a.timeTakenSec - b.timeTakenSec).slice(0, 10).map(row),
    recent: attempts.slice(0, 15).map(row),
  };
};

// ---------------------------------------------------------------------------------------------
// assignments
// ---------------------------------------------------------------------------------------------
const listAssignments = async ({ courseSlug, status, q } = {}) => {
  const filter = {};
  if (courseSlug) filter.courseSlug = asString(courseSlug).toLowerCase();
  if (STATUSES.includes(status)) filter.status = status;
  let list = await Assignment.find(filter).sort({ updatedAt: -1 }).lean();
  const needle = norm(q);
  if (needle) list = list.filter((x) => norm(`${x.title} ${x.courseTitle}`).includes(needle));

  const subs = list.length ? await Submission.find({ assignment: { $in: list.map((x) => x._id) } }).select('assignment status late grade').lean() : [];
  const stats = new Map();
  subs.forEach((s) => {
    const cur = stats.get(String(s.assignment)) || { submitted: 0, pending: 0, graded: 0, sum: 0 };
    cur.submitted += 1;
    if (s.status === 'graded') {
      cur.graded += 1;
      cur.sum += s.grade || 0;
    } else if (s.status === 'submitted') cur.pending += 1;
    stats.set(String(s.assignment), cur);
  });
  return list.map((x) => {
    const s = stats.get(idOf(x)) || { submitted: 0, pending: 0, graded: 0, sum: 0 };
    return { ...toAssignment(x), submitted: s.submitted, pending: s.pending, graded: s.graded, avgGrade: s.graded ? Math.round(s.sum / s.graded) : 0 };
  });
};

const findAssignment = async (id) => {
  if (!isId(id)) throw new ApiError(404, 'Assignment not found');
  const a = await Assignment.findById(id);
  if (!a) throw new ApiError(404, 'Assignment not found');
  return a;
};

const getAssignment = async (id) => toAssignment(await findAssignment(id));

const createAssignment = async (body, admin) => {
  const data = cleanAssignment(body, { create: true });
  const course = await courseFor(body.courseSlug);
  const a = await Assignment.create({ maxPoints: 100, allowLate: true, submissionTypes: ['text', 'file'], maxFiles: 3, resources: [], ...data, courseSlug: course.slug, courseTitle: course.title, status: data.status || 'draft', createdBy: admin._id });
  return toAssignment(a);
};

const updateAssignment = async (id, body) => {
  const a = await findAssignment(id);
  const data = cleanAssignment(body, { create: false });
  if (has(body, 'courseSlug') && asString(body.courseSlug).toLowerCase() !== a.courseSlug) {
    const course = await courseFor(body.courseSlug);
    a.courseSlug = course.slug;
    a.courseTitle = course.title;
  }
  Object.entries(data).forEach(([k, v]) => {
    a[k] = v;
  });
  await a.save();
  return toAssignment(a);
};

const deleteAssignment = async (id) => {
  const a = await findAssignment(id);
  await Submission.deleteMany({ assignment: a._id });
  await Assignment.deleteOne({ _id: a._id });
  return { id: idOf(a) };
};

const duplicateAssignment = async (id, admin) => {
  const src = toAssignment(await findAssignment(id));
  const { id: _id, createdAt, updatedAt, ...rest } = src;
  const copy = await Assignment.create({ ...rest, title: `${src.title} (copy)`.slice(0, 140), status: 'draft', dueAt: null, createdBy: admin._id });
  return toAssignment(copy);
};

const toSubmission = (s, who) => ({
  id: idOf(s),
  assignmentId: String(s.assignment),
  studentId: String(s.user),
  student: (who.get(String(s.user)) || { name: 'Student' }).name,
  email: (who.get(String(s.user)) || {}).email || '',
  text: s.text || '',
  link: s.link || '',
  files: (s.files || []).map((f) => ({ name: f.name, url: f.url, size: f.size || 0, type: f.type || '' })),
  status: s.status,
  late: Boolean(s.late),
  version: s.version || 1,
  submittedAt: s.submittedAt,
  grade: s.grade == null ? null : s.grade,
  feedback: s.feedback || '',
  gradedAt: s.gradedAt || null,
});

const listSubmissions = async (assignmentId) => {
  const a = await findAssignment(assignmentId);
  const subs = await Submission.find({ assignment: a._id }).sort({ submittedAt: -1 }).lean();
  const who = await people(subs.map((s) => s.user));
  const list = subs.map((s) => toSubmission(s, who));
  const graded = list.filter((s) => s.status === 'graded');
  // students who can see it but have not handed in yet
  const enrolled = await StudentProgress.find({ 'enrollments.courseSlug': a.courseSlug }).select('user').lean();
  const handedIn = new Set(subs.map((s) => String(s.user)));
  const missing = enrolled.filter((p) => !handedIn.has(String(p.user)));
  const missingWho = await people(missing.map((p) => p.user));
  return {
    assignment: toAssignment(a),
    summary: {
      enrolled: enrolled.length,
      submitted: list.length,
      pending: list.filter((s) => s.status === 'submitted').length,
      graded: graded.length,
      late: list.filter((s) => s.late).length,
      avgGrade: graded.length ? Math.round(graded.reduce((s, x) => s + (x.grade || 0), 0) / graded.length) : 0,
    },
    submissions: list,
    notSubmitted: missing.map((p) => ({ studentId: String(p.user), student: (missingWho.get(String(p.user)) || { name: 'Student' }).name, email: (missingWho.get(String(p.user)) || {}).email || '' })),
  };
};

/** body: { grade?: number, feedback?: string, status?: 'graded' | 'returned' } */
const gradeSubmission = async (id, body, admin) => {
  if (!isId(id)) throw new ApiError(404, 'Submission not found');
  const sub = await Submission.findById(id);
  if (!sub) throw new ApiError(404, 'Submission not found');
  const a = await Assignment.findById(sub.assignment);
  if (!a) throw new ApiError(404, 'Assignment not found');

  const status = has(body, 'status') ? body.status : 'graded';
  if (!['graded', 'returned', 'submitted'].includes(status)) throw new ApiError(400, 'Status must be graded or returned');
  const feedback = text(body.feedback, 'Feedback', 3000, { multiline: true });

  if (status === 'graded') {
    const grade = Number(body.grade);
    if (body.grade === '' || body.grade === null || body.grade === undefined || !Number.isFinite(grade) || grade < 0 || grade > a.maxPoints) throw new ApiError(400, `Marks must be between 0 and ${a.maxPoints}`);
    sub.grade = Math.round(grade * 100) / 100;
  } else if (status === 'returned') {
    if (!feedback) throw new ApiError(400, 'Tell the student what to improve');
    sub.grade = null;
  } else {
    sub.grade = null;
  }
  sub.status = status;
  sub.feedback = feedback;
  sub.gradedAt = status === 'submitted' ? null : new Date();
  sub.gradedBy = admin._id;
  await sub.save();

  // tell the student (shows in Recent Activity on the dashboard)
  if (status !== 'submitted') {
    const progress = await StudentProgress.findOne({ user: sub.user });
    if (progress) {
      progress.activity.push({
        type: 'assignment',
        title: status === 'graded' ? 'Assignment graded' : 'Assignment returned',
        subtitle: `${a.title}${status === 'graded' ? ` - ${sub.grade}/${a.maxPoints}` : ' - please redo'}`.slice(0, 160),
        at: new Date(),
      });
      await progress.save();
    }
  }
  const who = await people([sub.user]);
  return toSubmission(sub, who);
};

module.exports = {
  listCourses,
  getOverview,
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  getQuizAnalytics,
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  duplicateAssignment,
  listSubmissions,
  gradeSubmission,
};