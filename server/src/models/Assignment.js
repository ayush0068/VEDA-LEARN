const mongoose = require('mongoose');

/** An assignment of a course (admin panel -> Quizzes & Assignments). Students hand in text, a link and / or files. */
const assignmentSchema = new mongoose.Schema(
  {
    courseSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    courseTitle: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', trim: true, maxlength: 5000 }, // the instructions
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    dueAt: { type: Date, default: null },
    maxPoints: { type: Number, default: 100, min: 1, max: 1000 },
    allowLate: { type: Boolean, default: true },
    submissionTypes: { type: [String], default: ['text', 'file'] }, // any of text | file | link
    maxFiles: { type: Number, default: 3, min: 1, max: 10 },
    resources: { type: [{ title: { type: String, trim: true, maxlength: 120 }, url: { type: String, trim: true } }], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

assignmentSchema.index({ courseSlug: 1, status: 1 });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);