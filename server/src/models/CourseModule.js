const mongoose = require('mongoose');

/**
 * A module (chapter) of a course, e.g. "Module 2: Karma & Dharma". Its lessons live in the Lesson model.
 * Created in the admin panel (Modules & Lessons). The published modules also fill the curriculum of the website's
 * Course Details page (see services/curriculum.service.js -> syncCourse).
 */
const courseModuleSchema = new mongoose.Schema(
  {
    courseSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    // how many weeks this module takes (shown in the curriculum of the course page)
    weeks: { type: Number, default: 1, min: 1, max: 52 },
    order: { type: Number, default: 0 },
    // a draft module and its lessons are invisible on the website
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true },
);

courseModuleSchema.index({ courseSlug: 1, order: 1 });

module.exports = mongoose.models.CourseModule || mongoose.model('CourseModule', courseModuleSchema);