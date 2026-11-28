const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Submission = require('../models/Submission');
const ApiError = require('../utils/ApiError');
const { normalizeMediaUrl } = require('../utils/media');
const { scoreAttempt, totalPoints, shuffle, norm } = require('../utils/quizScoring');
const { getOrCreateProgress } = require('./dashboard.service');

/**
 * Student side of Quizzes & Assignments.
 *
 * - A student sees the PUBLISHED quizzes / assignments of the courses they are enrolled in (free courses are open to everyone).
 * - Quizzes are scored on the server. The right answers are sent only AFTER the attempt (and only when the quiz allows it).
 * - The timer lives on the server too (attempt.expiresAt): late answers are not accepted, an expired attempt is submitted automatically.
 */

const idOf = (doc) => String(doc._id);
const isId = (value) => /^[a-f0-9]{24}$/i.test(String(value)) && mongoose.isValidObjectId(value);
const GRACE_MS = 8000; // network delay allowance when the timer ends
const isAdmin = (user) => user.role === 'admin';

// ---------------------------------------------------------------------------------------------
// who may see what
// ---------------------------------------------------------------------------------------------
/** slugs of the courses this student can use: enrolled + every free course */
const courseAccess = async (user) => {
  const progress = await getOrCreateProgress(user._id);
  const enrolled = new Set(progress.enrollments.map((e) => e.courseSlug));
  const free = await Course.find({ isActive: true, $or: [{ isFree: true }, { price: 0 }] }).select('slug').lean();
  free.forEach((c) => enrolled.add(c.slug));
  return { progress, slugs: enrolled };
};

const assertAccess = async (user, slug) => {
  if (isAdmin(user)) return null;
  const { progress, slugs } = await courseAccess(user);
  if (!slugs.has(slug)) throw new ApiError(403, 'Enroll in this course to open this');
  return progress;
};

const quizWindow = (quiz, now = new Date()) => {
  if (quiz.availableFrom && now < new Date(quiz.availableFrom)) return 'upcoming';
  if (quiz.availableUntil && now > new Date(quiz.availableUntil)) return 'closed';
  return 'open';
};

// ---------------------------------------------------------------------------------------------
// attempts
// ---------------------------------------------------------------------------------------------
/** submits an in-progress attempt (also used when its time is over) */
const finishAttempt = async (attempt, quiz, given, { timedOut = false } = {}) => {
  // the autosaved answers, overlaid with whatever came with the final click
  const saved = new Map(attempt.answers.map((a) => [String(a.question), a.toObject ? a.toObject() : a]));
  (given || []).forEach((a) => saved.set(String(a.question), a));
  const merged = [...saved.values()];
  const result = scoreAttempt(quiz, merged);
  const now = new Date();
  attempt.answers = result.answers;
  attempt.score = result.score;
  attempt.total = result.total;
  attempt.percent = result.percent;
  attempt.passed = result.passed;
  attempt.status = 'submitted';
  attempt.submittedAt = now;
  attempt.timedOut = timedOut;
  const spent = Math.round((now - new Date(attempt.startedAt)) / 1000);
  attempt.timeTakenSec = Math.max(0, quiz.timeLimitMin ? Math.min(spent, quiz.timeLimitMin * 60) : spent);
  await attempt.save();

  try {
    const progress = await getOrCreateProgress(attempt.user);
    progress.activity.push({ type: 'assignment', title: result.passed ? 'Passed a quiz' : 'Completed a quiz', subtitle: `${quiz.title} - ${result.percent}%`.slice(0, 160), at: now });
    await progress.save();
  } catch {
    /* the activity line is only a nicety */
  }
  return attempt;
};

/** closes the attempt when its timer has run out */
const expireIfNeeded = async (attempt, quiz) => {
  if (attempt.status === 'in_progress' && attempt.expiresAt && Date.now() > new Date(attempt.expiresAt).getTime() + GRACE_MS) {
    await finishAttempt(attempt, quiz, null, { timedOut: true });
  }
  return attempt;
};

const showsAnswers = (quiz, attempt) => {
  if (attempt.status !== 'submitted') return false;
  if (quiz.showAnswers === 'never') return false;
  if (quiz.showAnswers === 'after_pass') return Boolean(attempt.passed);
  return true;
};

const toAttemptSummary = (a) => ({ id: idOf(a), attemptNo: a.attemptNo, status: a.status, percent: a.percent, score: a.score, total: a.total, passed: Boolean(a.passed), timeTakenSec: a.timeTakenSec || 0, submittedAt: a.submittedAt, timedOut: Boolean(a.timedOut) });

const attemptsOf = async (quizId, userId) => QuizAttempt.find({ quiz: quizId, user: userId }).sort({ attemptNo: 1 });

const quizState = (quiz, attempts, user) => {
  const submitted = attempts.filter((a) => a.status === 'submitted');
  const running = attempts.find((a) => a.status === 'in_progress');
  const best = submitted.reduce((m, a) => (a.percent > m ? a.percent : m), 0);
  const window = quizWindow(quiz);
  const used = submitted.length;
  const left = quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - used) : null;
  let status = 'new';
  if (running) status = 'in_progress';
  else if (submitted.some((a) => a.passed)) status = 'passed';
  else if (submitted.length) status = 'failed';
  const canStart = Boolean(running) || (window === 'open' && (left === null || left > 0));
  return { status, window, attemptsUsed: used, attemptsLeft: left, bestPercent: submitted.length ? best : null, inProgressId: running ? idOf(running) : null, canStart: canStart || isAdmin(user) };
};

const quizCard = (quiz, attempts, user) => ({
  id: idOf(quiz),
  courseSlug: quiz.courseSlug,
  courseTitle: quiz.courseTitle || '',
  title: quiz.title,
  description: quiz.description || '',
  questionCount: (quiz.questions || []).length,
  totalPoints: totalPoints(quiz),
  timeLimitMin: quiz.timeLimitMin || 0,
  passPercent: quiz.passPercent,
  maxAttempts: quiz.maxAttempts || 0,
  availableFrom: quiz.availableFrom || null,
  availableUntil: quiz.availableUntil || null,
  ...quizState(quiz, attempts, user),
});

// ---------------------------------------------------------------------------------------------
// hub: everything the student has to do
// ---------------------------------------------------------------------------------------------
const submissionState = (assignment, sub, now = new Date()) => {
  if (sub) return sub.status; // submitted | graded | returned
  if (assignment.dueAt && now > new Date(assignment.dueAt)) return assignment.allowLate === false ? 'closed' : 'overdue';
  return 'todo';
};

const assignmentCard = (a, sub) => ({
  id: idOf(a),
  courseSlug: a.courseSlug,
  courseTitle: a.courseTitle || '',
  title: a.title,
  dueAt: a.dueAt || null,
  maxPoints: a.maxPoints,
  allowLate: a.allowLate !== false,
  state: submissionState(a, sub),
  grade: sub && sub.status === 'graded' ? sub.grade : null,
  submittedAt: sub ? sub.submittedAt : null,
  late: sub ? Boolean(sub.late) : false,
});

/** puts the assignments on the dashboard calendar (StudentProgress.assignments) */
const syncProgress = async (progress, assignments, subs) => {
  if (!progress) return;
  const done = new Map(subs.map((s) => [String(s.assignment), s]));
  let changed = false;
  assignments.forEach((a) => {
    if (!a.dueAt) return;
    const sub = done.get(idOf(a));
    const slot = progress.assignments.find((x) => x.courseSlug === a.courseSlug && x.title === a.title);
    if (!slot) {
      progress.assignments.push({ title: a.title.slice(0, 120), courseSlug: a.courseSlug, courseTitle: (a.courseTitle || '').slice(0, 120), dueAt: a.dueAt, submittedAt: sub ? sub.submittedAt : undefined });
      changed = true;
    } else if (String(slot.dueAt) !== String(a.dueAt) || Boolean(slot.submittedAt) !== Boolean(sub)) {
      slot.dueAt = a.dueAt;
      slot.submittedAt = sub ? sub.submittedAt : undefined;
      changed = true;
    }
  });
  if (changed) await progress.save();
};

const getHub = async (user) => {
  const { progress, slugs } = isAdmin(user) ? { progress: null, slugs: null } : await courseAccess(user);
  const scope = slugs ? { courseSlug: { $in: [...slugs] } } : {};

  const quizzes = await Quiz.find({ ...scope, status: 'published' }).sort({ createdAt: -1 });
  const assignments = await Assignment.find({ ...scope, status: 'published' }).sort({ dueAt: 1, createdAt: -1 });
  const attempts = quizzes.length ? await QuizAttempt.find({ user: user._id, quiz: { $in: quizzes.map((q) => q._id) } }).sort({ attemptNo: 1 }) : [];
  const subs = assignments.length ? await Submission.find({ user: user._id, assignment: { $in: assignments.map((a) => a._id) } }) : [];

  // an attempt whose timer ended while the student was away is closed now
  for (const a of attempts) {
    if (a.status === 'in_progress') {
      const quiz = quizzes.find((q) => idOf(q) === String(a.quiz));
      if (quiz) await expireIfNeeded(a, quiz);
    }
  }

  const byQuiz = new Map();
  attempts.forEach((a) => byQuiz.set(String(a.quiz), [...(byQuiz.get(String(a.quiz)) || []), a]));
  const bySub = new Map(subs.map((s) => [String(s.assignment), s]));

  const quizCards = quizzes.map((q) => quizCard(q, byQuiz.get(idOf(q)) || [], user));
  const assignmentCards = assignments.map((a) => assignmentCard(a, bySub.get(idOf(a))));
  if (progress) await syncProgress(progress, assignments, subs);

  const submitted = attempts.filter((a) => a.status === 'submitted');
  const graded = subs.filter((s) => s.status === 'graded');
  const gradedPct = graded.map((s) => {
    const a = assignments.find((x) => idOf(x) === String(s.assignment));
    return a ? Math.round(((s.grade || 0) / a.maxPoints) * 100) : 0;
  });
  return {
    quizzes: quizCards,
    assignments: assignmentCards,
    stats: {
      quizzesTaken: new Set(submitted.map((a) => String(a.quiz))).size,
      quizzesPassed: new Set(submitted.filter((a) => a.passed).map((a) => String(a.quiz))).size,
      avgQuizPercent: submitted.length ? Math.round(submitted.reduce((s, a) => s + a.percent, 0) / submitted.length) : 0,
      assignmentsDone: subs.length,
      assignmentsPending: assignmentCards.filter((a) => a.state === 'todo' || a.state === 'overdue' || a.state === 'returned').length,
      avgAssignmentPercent: gradedPct.length ? Math.round(gradedPct.reduce((s, n) => s + n, 0) / gradedPct.length) : 0,
    },
  };
};

// ---------------------------------------------------------------------------------------------
// quiz: intro -> start -> answer -> submit -> review
// ---------------------------------------------------------------------------------------------
const loadPublishedQuiz = async (user, id) => {
  if (!isId(id)) throw new ApiError(404, 'Quiz not found');
  const quiz = await Quiz.findById(id);
  if (!quiz || (quiz.status !== 'published' && !isAdmin(user))) throw new ApiError(404, 'Quiz not found');
  await assertAccess(user, quiz.courseSlug);
  return quiz;
};

const getQuizIntro = async (user, id) => {
  const quiz = await loadPublishedQuiz(user, id);
  const attempts = await attemptsOf(quiz._id, user._id);
  for (const a of attempts) await expireIfNeeded(a, quiz);
  return { quiz: { ...quizCard(quiz, attempts, user), instructions: quiz.description || '' }, attempts: attempts.filter((a) => a.status === 'submitted').map(toAttemptSummary) };
};

/** the questions as THIS student sees them: no right answers, in the attempt's own order */
const attemptQuestions = (quiz, attempt) => {
  const byId = new Map(quiz.questions.map((q) => [idOf(q), q]));
  const order = attempt.questionOrder.length ? attempt.questionOrder : quiz.questions.map(idOf);
  return order
    .map((qid) => byId.get(qid))
    .filter(Boolean)
    .map((q) => {
      const optById = new Map((q.options || []).map((o) => [idOf(o), o]));
      const optOrder = (attempt.optionOrder && attempt.optionOrder[idOf(q)]) || (q.options || []).map(idOf);
      return {
        id: idOf(q),
        type: q.type,
        text: q.text,
        image: q.image || '',
        points: q.points || 1,
        multiple: q.type === 'multiple',
        options: optOrder.map((oid) => optById.get(oid)).filter(Boolean).map((o) => ({ id: idOf(o), text: o.text })),
      };
    });
};

const runPayload = (quiz, attempt) => ({
  attempt: { id: idOf(attempt), attemptNo: attempt.attemptNo, startedAt: attempt.startedAt, expiresAt: attempt.expiresAt || null, serverNow: new Date() },
  quiz: { id: idOf(quiz), title: quiz.title, courseTitle: quiz.courseTitle || '', timeLimitMin: quiz.timeLimitMin || 0, passPercent: quiz.passPercent },
  questions: attemptQuestions(quiz, attempt),
  saved: attempt.answers.map((a) => ({ question: String(a.question), selected: a.selected || [], text: a.text || '' })),
});

const startQuiz = async (user, id) => {
  const quiz = await loadPublishedQuiz(user, id);
  if (!quiz.questions.length) throw new ApiError(400, 'This quiz has no questions yet');
  const attempts = await attemptsOf(quiz._id, user._id);
  for (const a of attempts) await expireIfNeeded(a, quiz);

  const running = attempts.find((a) => a.status === 'in_progress');
  if (running) return runPayload(quiz, running);

  const window = quizWindow(quiz);
  if (!isAdmin(user)) {
    if (window === 'upcoming') throw new ApiError(403, 'This quiz is not open yet');
    if (window === 'closed') throw new ApiError(403, 'This quiz is closed');
    const used = attempts.filter((a) => a.status === 'submitted').length;
    if (quiz.maxAttempts && used >= quiz.maxAttempts) throw new ApiError(403, 'You have used all your attempts');
  }

  const qids = quiz.questions.map(idOf);
  const optionOrder = {};
  quiz.questions.forEach((q) => {
    const ids = (q.options || []).map(idOf);
    // True / False always keeps its natural order
    optionOrder[idOf(q)] = quiz.shuffleOptions && q.type !== 'truefalse' ? shuffle(ids) : ids;
  });
  const now = new Date();
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    user: user._id,
    courseSlug: quiz.courseSlug,
    attemptNo: attempts.length + 1,
    status: 'in_progress',
    startedAt: now,
    expiresAt: quiz.timeLimitMin ? new Date(now.getTime() + quiz.timeLimitMin * 60 * 1000) : null,
    questionOrder: quiz.shuffleQuestions ? shuffle(qids) : qids,
    optionOrder,
    answers: [],
  });
  return runPayload(quiz, attempt);
};

const loadAttempt = async (user, id) => {
  if (!isId(id)) throw new ApiError(404, 'Attempt not found');
  const attempt = await QuizAttempt.findById(id);
  if (!attempt || String(attempt.user) !== String(user._id)) throw new ApiError(404, 'Attempt not found');
  const quiz = await Quiz.findById(attempt.quiz);
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  await expireIfNeeded(attempt, quiz);
  return { attempt, quiz };
};

const cleanAnswer = (quiz, raw) => {
  if (!raw || typeof raw !== 'object') throw new ApiError(400, 'Answer is not valid');
  const q = quiz.questions.find((x) => idOf(x) === String(raw.question));
  if (!q) throw new ApiError(400, 'Unknown question');
  const valid = new Set((q.options || []).map(idOf));
  let selected = (Array.isArray(raw.selected) ? raw.selected : []).map(String).filter((o) => valid.has(o));
  if (q.type !== 'multiple') selected = selected.slice(0, 1);
  return { question: q._id, selected: [...new Set(selected)], text: q.type === 'short' ? String(raw.text || '').slice(0, 500) : '' };
};

/** autosave of one answer */
const saveAnswer = async (user, id, raw) => {
  const { attempt, quiz } = await loadAttempt(user, id);
  if (attempt.status !== 'in_progress') throw new ApiError(409, 'This attempt is already submitted');
  const clean = cleanAnswer(quiz, raw);
  const rest = attempt.answers.filter((a) => String(a.question) !== String(clean.question));
  const empty = !clean.selected.length && !norm(clean.text);
  attempt.answers = empty ? rest : [...rest.map((a) => (a.toObject ? a.toObject() : a)), clean];
  await attempt.save();
  return { saved: true, answered: attempt.answers.length };
};

const submitQuiz = async (user, id, rawAnswers) => {
  const { attempt, quiz } = await loadAttempt(user, id);
  if (attempt.status === 'submitted') return reviewPayload(quiz, attempt);
  const given = Array.isArray(rawAnswers) ? rawAnswers.map((a) => cleanAnswer(quiz, a)) : null;
  // answers sent with the final click count only while the time is still running (the autosaved ones always count)
  await finishAttempt(attempt, quiz, given);
  return reviewPayload(quiz, attempt);
};

/** result + (when allowed) the right answers and explanations */
const reviewPayload = (quiz, attempt) => {
  const reveal = showsAnswers(quiz, attempt);
  const answers = new Map(attempt.answers.map((a) => [String(a.question), a]));
  const questions = attemptQuestions(quiz, attempt).map((q, i) => {
    const full = quiz.questions.find((x) => idOf(x) === q.id);
    const a = answers.get(q.id);
    const out = { ...q, number: i + 1, answered: Boolean(a), yourSelected: a ? a.selected || [] : [], yourText: a ? a.text || '' : '', correct: a ? Boolean(a.correct) : false, earned: a ? a.earned : 0 };
    if (reveal) {
      out.correctOptionIds = (full.options || []).filter((o) => o.correct).map(idOf);
      out.acceptedAnswers = full.type === 'short' ? full.acceptedAnswers || [] : [];
      out.explanation = full.explanation || '';
    }
    return out;
  });
  return {
    attempt: { ...toAttemptSummary(attempt), startedAt: attempt.startedAt },
    quiz: { id: idOf(quiz), title: quiz.title, courseSlug: quiz.courseSlug, courseTitle: quiz.courseTitle || '', passPercent: quiz.passPercent, maxAttempts: quiz.maxAttempts || 0, showAnswers: quiz.showAnswers },
    revealed: reveal,
    counts: { correct: questions.filter((q) => q.correct).length, wrong: questions.filter((q) => q.answered && !q.correct).length, skipped: questions.filter((q) => !q.answered).length, total: questions.length },
    questions,
  };
};

const getAttempt = async (user, id) => {
  const { attempt, quiz } = await loadAttempt(user, id);
  if (attempt.status === 'in_progress') return { inProgress: true, ...runPayload(quiz, attempt) };
  return { inProgress: false, ...reviewPayload(quiz, attempt) };
};

// ---------------------------------------------------------------------------------------------
// assignments
// ---------------------------------------------------------------------------------------------
const loadPublishedAssignment = async (user, id) => {
  if (!isId(id)) throw new ApiError(404, 'Assignment not found');
  const a = await Assignment.findById(id);
  if (!a || (a.status !== 'published' && !isAdmin(user))) throw new ApiError(404, 'Assignment not found');
  const progress = await assertAccess(user, a.courseSlug);
  return { a, progress };
};

const toMySubmission = (s) =>
  s
    ? {
        id: idOf(s),
        text: s.text || '',
        link: s.link || '',
        files: (s.files || []).map((f) => ({ name: f.name, url: f.url, size: f.size || 0, type: f.type || '' })),
        status: s.status,
        late: Boolean(s.late),
        version: s.version || 1,
        submittedAt: s.submittedAt,
        grade: s.status === 'graded' ? s.grade : null,
        feedback: s.status === 'submitted' ? '' : s.feedback || '',
        gradedAt: s.gradedAt || null,
      }
    : null;

const getAssignment = async (user, id) => {
  const { a } = await loadPublishedAssignment(user, id);
  const sub = await Submission.findOne({ assignment: a._id, user: user._id });
  return {
    assignment: {
      ...assignmentCard(a, sub),
      description: a.description || '',
      submissionTypes: a.submissionTypes || ['text', 'file'],
      maxFiles: a.maxFiles || 3,
      resources: (a.resources || []).map((r) => ({ title: r.title, url: r.url })),
      canSubmit: !(a.dueAt && new Date() > new Date(a.dueAt) && a.allowLate === false) && (!sub || sub.status !== 'graded'),
    },
    submission: toMySubmission(sub),
  };
};

const cleanFiles = (raw, max) => {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length > max) throw new ApiError(400, `You can attach at most ${max} files`);
  return list.map((f) => {
    const url = normalizeMediaUrl(String((f && f.url) || ''));
    if (!/^(\/api\/media\/|https?:\/\/)/i.test(url)) throw new ApiError(400, 'A file link is not valid');
    return { name: String((f && f.name) || 'file').slice(0, 120), url, size: Math.max(0, Number(f && f.size) || 0), type: String((f && f.type) || '').slice(0, 80) };
  });
};

/** body: { text, link, files: [{ name, url, size, type }] } - handing in again replaces the old hand-in until it is graded */
const submitAssignment = async (user, id, body) => {
  if (isAdmin(user)) throw new ApiError(403, 'Admins cannot hand in assignments');
  const { a, progress } = await loadPublishedAssignment(user, id);
  const data = body && typeof body === 'object' ? body : {};
  const types = a.submissionTypes || ['text', 'file'];
  const now = new Date();
  const late = Boolean(a.dueAt && now > new Date(a.dueAt));
  if (late && a.allowLate === false) throw new ApiError(403, 'The deadline has passed');

  const existing = await Submission.findOne({ assignment: a._id, user: user._id });
  if (existing && existing.status === 'graded') throw new ApiError(409, 'This assignment is already graded');

  const text = types.includes('text') ? String(data.text || '').trim().slice(0, 10000) : '';
  let link = types.includes('link') ? String(data.link || '').trim() : '';
  if (link && !/^https?:\/\/\S+$/i.test(link)) throw new ApiError(400, 'The link must start with http:// or https://');
  link = link.slice(0, 500);
  const files = types.includes('file') ? cleanFiles(data.files, a.maxFiles || 3) : [];
  if (!text && !link && !files.length) throw new ApiError(400, 'Add your answer, a link or a file first');

  const fields = { text, link, files, status: 'submitted', submittedAt: now, late, grade: null, feedback: '', gradedAt: null };
  let sub;
  if (existing) {
    Object.assign(existing, fields, { version: (existing.version || 1) + 1 });
    await existing.save();
    sub = existing;
  } else {
    try {
      sub = await Submission.create({ assignment: a._id, user: user._id, courseSlug: a.courseSlug, ...fields, version: 1 });
    } catch (err) {
      if (err && err.code === 11000) throw new ApiError(409, 'Already handed in. Please reload the page.');
      throw err;
    }
  }

  if (progress) {
    const slot = progress.assignments.find((x) => x.courseSlug === a.courseSlug && x.title === a.title);
    if (slot) slot.submittedAt = now;
    else progress.assignments.push({ title: a.title.slice(0, 120), courseSlug: a.courseSlug, courseTitle: (a.courseTitle || '').slice(0, 120), dueAt: a.dueAt || now, submittedAt: now });
    progress.activity.push({ type: 'assignment', title: 'Submitted Assignment', subtitle: a.title.slice(0, 160), at: now });
    await progress.save();
  }
  return { submission: toMySubmission(sub) };
};

module.exports = { getHub, getQuizIntro, startQuiz, saveAnswer, submitQuiz, getAttempt, getAssignment, submitAssignment };