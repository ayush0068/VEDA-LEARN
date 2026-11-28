const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  { text: { type: String, required: true, trim: true, maxlength: 300 }, correct: { type: Boolean, default: false } },
  { _id: true },
);

const questionSchema = new mongoose.Schema(
  {
    // single = one right option, multiple = several right options, truefalse = 2 options, short = typed answer
    type: { type: String, enum: ['single', 'multiple', 'truefalse', 'short'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    image: { type: String, default: '', trim: true },
    options: { type: [optionSchema], default: [] },
    // short answer: every accepted spelling (case and extra spaces are ignored)
    acceptedAnswers: { type: [String], default: [] },
    points: { type: Number, default: 1, min: 1, max: 100 },
    explanation: { type: String, default: '', trim: true, maxlength: 1000 },
  },
  { _id: true },
);

/** A quiz of a course, built in the admin panel (Quizzes & Assignments) and taken by students. */
const quizSchema = new mongoose.Schema(
  {
    courseSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    courseTitle: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    timeLimitMin: { type: Number, default: 0, min: 0, max: 600 }, // 0 = no time limit
    passPercent: { type: Number, default: 60, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 0, min: 0, max: 50 }, // 0 = unlimited
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    // when the student may see the right answers
    showAnswers: { type: String, enum: ['after_submit', 'after_pass', 'never'], default: 'after_submit' },
    availableFrom: { type: Date, default: null },
    availableUntil: { type: Date, default: null },
    questions: { type: [questionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

quizSchema.index({ courseSlug: 1, status: 1 });

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);