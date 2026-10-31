const mongoose = require('mongoose');

/** Messages sent from the "Send Us a Message" form on the Contact page. */
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    queryType: { type: String, required: true, trim: true, maxlength: 60 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },
  },
  { timestamps: true },
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);