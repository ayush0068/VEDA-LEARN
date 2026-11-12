const mongoose = require('mongoose');
const { PERMISSION_KEYS, ROLE_VALUES, SLOT_KIND_VALUES } = require('../config/instructorAccess');

// One recurring weekly session decided by the admin (e.g. every Monday 18:00-19:30, live class for a course).
const slotSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday ... 6 = Saturday
    start: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    end: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    kind: { type: String, enum: SLOT_KIND_VALUES, default: 'live-class' },
    title: { type: String, default: '', trim: true, maxlength: 60 },
    courseSlug: { type: String, default: '', trim: true, lowercase: true },
  },
  { _id: true },
);

const permissionShape = Object.fromEntries(PERMISSION_KEYS.map((key) => [key, { type: Boolean, default: false }]));

/** Teaching details of a user with role "instructor". The login itself lives in the User document. */
const instructorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    title: { type: String, default: '', trim: true, maxlength: 80 }, // e.g. "Jyotish Acharya"
    bio: { type: String, default: '', trim: true, maxlength: 600 },
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    expertise: { type: [String], default: [] },

    // decided by the admin
    instructorRole: { type: String, enum: ROLE_VALUES, default: 'instructor' },
    permissions: { type: new mongoose.Schema(permissionShape, { _id: false }), default: () => ({}) },
    courses: { type: [String], default: [] }, // Course slugs they may teach
    timezone: { type: String, default: 'Asia/Kolkata' },
    schedule: { type: [slotSchema], default: [] },
  },
  { timestamps: true },
);

instructorProfileSchema.index({ instructorRole: 1 });

module.exports = mongoose.model('InstructorProfile', instructorProfileSchema);