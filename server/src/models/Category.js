const mongoose = require('mongoose');

/**
 * Course categories shown on the homepage ("Explore Our Course Categories").
 * Courses will reference a category by its slug later; the admin panel will manage these.
 */
const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 160 },
    // Card image: a path inside client/public (e.g. /images/categories/vastu-shastra.jpg) or a full URL
    image: { type: String, default: '', trim: true },
    // lucide icon key used as fallback when the image is missing
    icon: { type: String, default: 'sparkles', trim: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);