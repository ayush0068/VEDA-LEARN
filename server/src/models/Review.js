const mongoose = require('mongoose');

/** Student reviews shown on the Course Details page (only approved ones are public). */
const reviewSchema = new mongoose.Schema({
  courseSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 600 },
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ courseSlug: 1, isApproved: 1, createdAt: -1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);