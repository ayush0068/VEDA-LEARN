const mongoose = require('mongoose');

/**
 * One line of the admin "record book": who did what, when and from where.
 * Only changes (create / edit / delete ...), sign-ins and refused attempts are written, never request bodies or passwords.
 * The admin's name is copied in, so the record stays readable after that admin is removed.
 */
const adminActivitySchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, default: '' },
    adminEmail: { type: String, default: '' },

    type: { type: String, enum: ['auth', 'change'], default: 'change' },
    action: { type: String, required: true, maxlength: 60 }, // e.g. "course.create", "auth.login"
    module: { type: String, default: '', maxlength: 30 }, // students | courses | team ...
    summary: { type: String, default: '', maxlength: 240 }, // "Created course “Python Basics”"
    outcome: { type: String, enum: ['success', 'denied', 'failed'], default: 'success' },
    status: { type: Number, default: 200 },

    method: { type: String, default: '' },
    path: { type: String, default: '', maxlength: 200 },
    targetId: { type: String, default: '', maxlength: 100 },
    targetLabel: { type: String, default: '', maxlength: 120 },

    ip: { type: String, default: '', maxlength: 64 },
    userAgent: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adminActivitySchema.index({ createdAt: -1 });
adminActivitySchema.index({ admin: 1, createdAt: -1 });
adminActivitySchema.index({ module: 1, createdAt: -1 });
// the record book keeps one year
adminActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.models.AdminActivity || mongoose.model('AdminActivity', adminActivitySchema);