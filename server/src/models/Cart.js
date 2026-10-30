const mongoose = require('mongoose');

/**
 * One cart per signed-in user. Items are course slugs (a course can only be in the cart once).
 * Guests keep their cart in the browser (localStorage) and it is merged into this one on login.
 */
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slugs: { type: [String], default: [] },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);