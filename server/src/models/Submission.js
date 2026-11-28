const mongoose = require('mongoose');

/** A student's hand-in of one assignment (one per student; handing in again replaces it until it is graded). */
const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    text: { type: String, default: '', maxlength: 10000 },
    link: { type: String, default: '', trim: true, maxlength: 500 },
    files: { type: [{ name: String, url: String, size: Number, type: String }], default: [] },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' }, // returned = please redo
    submittedAt: { type: Date, default: Date.now },
    late: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    grade: { type: Number, default: null },
    feedback: { type: String, default: '', maxlength: 3000 },
    gradedAt: { type: Date, default: null },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

submissionSchema.index({ assignment: 1, user: 1 }, { unique: true });

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);