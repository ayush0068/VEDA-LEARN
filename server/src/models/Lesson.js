const mongoose = require('mongoose');

const TYPES = ['video', 'article', 'document'];

/** One lesson inside a module: a video, a written lesson or a PDF, plus optional download links. */
const lessonSchema = new mongoose.Schema(
  {
    courseSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    type: { type: String, enum: TYPES, default: 'video' },
    // video: uploaded file / YouTube / Vimeo / mp4 link.   document: the PDF.   article: not used.
    mediaUrl: { type: String, default: '', trim: true, maxlength: 500 },
    // written lesson (article) or notes shown below the video
    content: { type: String, default: '', trim: true, maxlength: 20000 },
    durationMin: { type: Number, default: 0, min: 0, max: 1000 },
    resources: {
      type: [new mongoose.Schema({ title: { type: String, required: true, trim: true, maxlength: 80 }, url: { type: String, required: true, trim: true, maxlength: 500 } }, { _id: false })],
      default: [],
    },
    // a free preview can be watched before buying the course
    isPreview: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true },
);

lessonSchema.index({ module: 1, order: 1 });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
Lesson.TYPES = TYPES;

module.exports = Lesson;