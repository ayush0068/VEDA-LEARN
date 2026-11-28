const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, required: true },
    selected: { type: [String], default: [] }, // option ids
    text: { type: String, default: '', maxlength: 500 },
    correct: { type: Boolean, default: false },
    earned: { type: Number, default: 0 },
  },
  { _id: false },
);

/** One try of a student at a quiz. Scored on the server only. */
const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    attemptNo: { type: Number, default: 1 },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    timedOut: { type: Boolean, default: false },
    // the order this student sees (stable across reloads)
    questionOrder: { type: [String], default: [] },
    optionOrder: { type: mongoose.Schema.Types.Mixed, default: {} },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeTakenSec: { type: Number, default: 0 },
  },
  { timestamps: true, minimize: false },
);

quizAttemptSchema.index({ quiz: 1, user: 1, attemptNo: 1 });

module.exports = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);