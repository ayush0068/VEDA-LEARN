const mongoose = require('mongoose');

/** One document per (student, lesson) the student has marked as finished. Removing it = "mark as not done". */
const lessonProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseSlug: { type: String, required: true, trim: true, lowercase: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

lessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
lessonProgressSchema.index({ user: 1, courseSlug: 1 });

module.exports = mongoose.models.LessonProgress || mongoose.model('LessonProgress', lessonProgressSchema);