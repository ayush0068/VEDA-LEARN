const mongoose = require('mongoose');

const HIGHLIGHT_KEYS = ['steps', 'examples', 'assignments', 'doubts', 'community', 'verses', 'practice', 'notes'];

/**
 * The long content of the Course Details page (what you learn, curriculum, teacher info, FAQs...).
 * One document per course, linked by the course slug. Price / rating / title stay on the Course itself.
 * The future admin panel will edit this. A course without a document here still works: the website
 * shows automatically generated content for it.
 */
const courseContentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    tagline: { type: String, default: '', trim: true, maxlength: 200 },
    about: { type: String, default: '', trim: true, maxlength: 2000 },
    tags: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
    highlights: {
      type: [
        new mongoose.Schema(
          { key: { type: String, enum: HIGHLIGHT_KEYS, required: true }, label: { type: String, required: true, trim: true, maxlength: 60 } },
          { _id: false },
        ),
      ],
      default: [],
    },
    learn: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
    audience: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
    curriculum: {
      type: [
        new mongoose.Schema(
          {
            title: { type: String, required: true, trim: true, maxlength: 120 },
            lessons: { type: Number, required: true, min: 0 },
            weeks: { type: Number, required: true, min: 1 },
            topics: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    // use {name} in the bio where the teacher's name should appear
    instructor: {
      title: { type: String, default: '', trim: true, maxlength: 80 },
      experience: { type: String, default: '', trim: true, maxlength: 80 },
      bio: { type: String, default: '', trim: true, maxlength: 600 },
      coursesConducted: { type: Number, default: 0, min: 0 },
      students: { type: Number, default: 0, min: 0 },
      rating: { type: Number, default: 0, min: 0, max: 5 },
    },
    // number of ratings, shown as "4.8 (980)"
    ratingCount: { type: Number, default: 0, min: 0 },
    faqs: {
      type: [
        new mongoose.Schema(
          { q: { type: String, required: true, trim: true, maxlength: 160 }, a: { type: String, required: true, trim: true, maxlength: 800 } },
          { _id: false },
        ),
      ],
      default: [],
    },
    // promo band on phones
    bannerTitle: { type: String, default: '', trim: true, maxlength: 80 },
  },
  { timestamps: true },
);

const CourseContent = mongoose.models.CourseContent || mongoose.model('CourseContent', courseContentSchema);
CourseContent.HIGHLIGHT_KEYS = HIGHLIGHT_KEYS;

module.exports = CourseContent;