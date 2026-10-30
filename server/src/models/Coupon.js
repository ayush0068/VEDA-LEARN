const mongoose = require('mongoose');

/** Discount codes for the cart. The future admin panel will create / disable these. */
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 30 },
    description: { type: String, default: '', trim: true, maxlength: 80 },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    // percent: 1-100, flat: rupees
    value: { type: Number, required: true, min: 1 },
    // cap for percent coupons (rupees)
    maxDiscount: { type: Number, min: 1 },
    // minimum cart total (after course discounts) in rupees
    minOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);