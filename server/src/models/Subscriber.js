const mongoose = require('mongoose');

/** Newsletter subscribers collected from the footer "Stay Updated" form. */
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    source: { type: String, default: 'footer', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);