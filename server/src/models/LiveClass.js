const mongoose = require('mongoose');

const featuresSchema = new mongoose.Schema(
  {
    chat: { type: Boolean, default: true }, // class chat
    handRaise: { type: Boolean, default: true }, // students can raise a hand (to ask for the mic)
    polls: { type: Boolean, default: true }, // host can run quick polls
    reactions: { type: Boolean, default: true }, // 👏 🙏 ❤️ reactions
    studentCamera: { type: Boolean, default: false }, // host may also switch a student's camera on (mic is always possible)
    recording: { type: Boolean, default: true }, // host may record the class
  },
  { _id: false },
);

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    firstJoinedAt: { type: Date, required: true },
    lastLeftAt: { type: Date },
    totalSeconds: { type: Number, default: 0 },
    joins: { type: Number, default: 1 },
  },
  { _id: false },
);

/**
 * A live class: scheduled by the admin, taught in the browser with WebRTC (see live/ for the signalling server).
 * Live state (who is in the room right now) is kept in memory; this document keeps everything that must survive:
 * the schedule, attendance, chat log, poll results and the recording.
 */
const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    courseSlug: { type: String, default: '', trim: true, lowercase: true, index: true }, // '' = not tied to a course
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // instructor or admin who teaches
    startsAt: { type: Date, required: true, index: true },
    durationMin: { type: Number, required: true, min: 5, max: 480 },
    endsAt: { type: Date, required: true, index: true }, // startsAt + durationMin (kept in sync by the service)
    maxStudents: { type: Number, required: true, min: 1 },
    // enrolled = only students of the course; everyone = any signed-in student
    access: { type: String, enum: ['enrolled', 'everyone'], default: 'enrolled' },
    features: { type: featuresSchema, default: () => ({}) },
    resources: { type: [new mongoose.Schema({ title: { type: String, trim: true, maxlength: 80 }, url: { type: String, trim: true, maxlength: 500 } }, { _id: false })], default: [] },

    status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled', index: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    cancelReason: { type: String, default: '', maxlength: 200 },

    peakStudents: { type: Number, default: 0 },
    attendance: { type: [attendanceSchema], default: [] },
    messages: {
      type: [new mongoose.Schema({ userId: String, name: String, role: String, text: String, at: Date }, { _id: false })],
      default: [],
    },
    polls: {
      type: [new mongoose.Schema({ question: String, options: [{ _id: false, text: String, votes: Number }], total: Number, at: Date }, { _id: false })],
      default: [],
    },
    recording: {
      url: { type: String, default: '' },
      size: { type: Number, default: 0 },
      durationSec: { type: Number, default: 0 },
      createdAt: { type: Date },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.LiveClass || mongoose.model('LiveClass', liveClassSchema);