const mongoose = require('mongoose');

/**
 * A course purchase. The profile page ("Orders & Payments") lists these.
 * The future checkout creates them; nothing else writes to this collection yet.
 */
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [
      {
        _id: false,
        slug: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    couponCode: { type: String, default: null },
    paymentMethod: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);