const mongoose = require('mongoose');

/** One row per admin per day: how many requests they made and for how long they were active (gaps over 10 minutes do not count). */
const adminPresenceSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD in the panel's time zone
    requests: { type: Number, default: 0 },
    activeMs: { type: Number, default: 0 },
    firstAt: { type: Date },
    lastAt: { type: Date },
  },
  { versionKey: false },
);

adminPresenceSchema.index({ admin: 1, day: 1 }, { unique: true });
adminPresenceSchema.index({ day: 1 });
adminPresenceSchema.index({ lastAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 });

module.exports = mongoose.models.AdminPresence || mongoose.model('AdminPresence', adminPresenceSchema);