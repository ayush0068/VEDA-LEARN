const mongoose = require('mongoose');

/**
 * Homepage "Discover a Deeper You" items.
 * The future admin panel will create/edit these through the same model.
 */
const featureSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    // lucide icon key understood by the client, e.g. "book-open", "leaf"
    icon: { type: String, required: true, trim: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Feature || mongoose.model('Feature', featureSchema);