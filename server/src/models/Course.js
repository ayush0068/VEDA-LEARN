const mongoose = require('mongoose');

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

/**
 * Courses shown on the website (homepage "Popular Courses" + the Explore Courses page).
 * The future admin panel will create/edit these (pricing, badges, popularity) through the same model.
 */
const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    // Category slug used by the Courses page chips, e.g. "vedic-astrology", "ancient-texts"
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    // Path inside client/public (e.g. /images/courses/vastu-shastra-complete-course.png) or a full URL
    image: { type: String, default: '', trim: true },
    // lucide icon key used as fallback when the image is missing
    icon: { type: String, default: 'sparkles', trim: true },
    // Short text shown on the Courses page card (also searched by the search box)
    description: { type: String, default: '', trim: true, maxlength: 300 },
    // Course length in weeks (drives the Duration filter) and number of lessons
    weeks: { type: Number, min: 1 },
    lessons: { type: Number, min: 0 },
    level: { type: String, enum: LEVELS, default: 'All Levels' },
    language: { type: String, default: 'English', trim: true, maxlength: 30 },
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

courseSchema.index({ isActive: 1, order: 1 });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

Course.LEVELS = LEVELS;

module.exports = Course;