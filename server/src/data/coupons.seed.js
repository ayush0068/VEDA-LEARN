// SAMPLE COUPONS for testing the cart. Create real ones from the admin panel later.
const COUPON_SEEDS = [
  { code: 'VEDA10', description: '10% off your order', discountType: 'percent', value: 10, maxDiscount: 1000, minOrder: 0 },
  { code: 'VEDA20', description: '20% off orders above ₹1,999', discountType: 'percent', value: 20, maxDiscount: 1500, minOrder: 1999 },
  { code: 'WELCOME200', description: '₹200 off your first order', discountType: 'flat', value: 200, minOrder: 999 },
];

module.exports = { COUPON_SEEDS };