const mongoose = require('mongoose');

const bool = (value) => ({ type: Boolean, default: value });

/**
 * Website users (students now, admins when the admin/ panel is built).
 * The password is only ever stored as a bcrypt hash and is never returned by queries
 * unless explicitly requested with .select('+passwordHash').
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // tokens issued before this moment are rejected (set when the password is changed)
    passwordChangedAt: { type: Date },

    // --- profile page ---
    studentId: { type: String, unique: true, sparse: true }, // e.g. VD-2026-001 (assigned on the first profile visit)
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['', 'male', 'female', 'other', 'prefer-not-to-say'], default: '' },
    location: { type: String, trim: true, maxlength: 100, default: '' },
    bio: { type: String, trim: true, maxlength: 300, default: '' },
    avatar: { type: String, default: '' }, // small image as a data URL (resized in the browser)

    notifications: {
      liveClasses: bool(true),
      courseUpdates: bool(true),
      assignments: bool(true),
      offers: bool(false),
      emailNotifications: bool(true),
    },
    privacy: {
      profileVisible: bool(true),
      showEmail: bool(false),
      showProgress: bool(true),
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);