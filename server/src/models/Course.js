const mongoose = require('mongoose');

/**
 * Courses shown on the website. The future admin panel will create/edit these
 * (pricing, badges, popularity) through the same model.
 */
const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    // Category slug (see Category model), e.g. "vedic-astrology"
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    // Path inside client/public (e.g. /images/courses/vastu-shastra-complete.jpg) or a full URL
    image: { type: String, default: '', trim: true },
    // lucide icon key used as fallback when the image is missing
    icon: { type: String, default: 'sparkles', trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    studentsCount: { type: Number, default: 0, min: 0 },
    // Prices in INR (whole rupees)
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    // Small label on the card, e.g. "Bestseller"
    badge: { type: String, default: '', trim: true, maxlength: 24 },
    isPopular: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);