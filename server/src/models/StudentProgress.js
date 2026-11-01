const mongoose = require('mongoose');

/**
 * One document per student: what they are learning and how far they are (powers the Student Dashboard).
 * Enrollments are stored here (the site has no checkout yet) - when payments are built, the
 * order flow should call `addEnrollment` in services/dashboard.service.js.
 */
const enrollmentSchema = new mongoose.Schema(
  {
    courseSlug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    totalLessons: { type: Number, required: true, min: 1 },
    completedLessons: { type: Number, default: 0, min: 0 },
    // e.g. "Module 4: Houses (Bhavas) in Astrology" - shown on "Continue Learning"
    currentModule: { type: String, default: '', trim: true, maxlength: 120 },
    // e.g. "Karma & Dharma (Module 2)" - shown in "Today's Schedule"
    nextLesson: { type: String, default: '', trim: true, maxlength: 120 },
    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { _id: false },
);

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    // lessons of the finished course (counts towards lifetime progress)
    lessons: { type: Number, default: 0, min: 0 },
    issuedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  courseSlug: { type: String, default: '', trim: true },
  courseTitle: { type: String, default: '', trim: true, maxlength: 120 },
  dueAt: { type: Date, required: true },
  submittedAt: { type: Date },
});

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lesson', 'live', 'assignment', 'certificate'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, default: '', trim: true, maxlength: 160 },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const studentProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enrollments: { type: [enrollmentSchema], default: [] },
    certificates: { type: [certificateSchema], default: [] },
    assignments: { type: [assignmentSchema], default: [] },
    activity: { type: [activitySchema], default: [] },
    liveClassesAttended: { type: Number, default: 0, min: 0 },
    liveClassesRegistered: { type: Number, default: 0, min: 0 },
    // true when the sample data below was generated (so it can be told apart from real learning data)
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.models.StudentProgress || mongoose.model('StudentProgress', studentProgressSchema);