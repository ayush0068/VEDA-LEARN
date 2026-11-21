/** 2999 -> "₹2,999" */
export const formatPrice = (amount: number): string =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;

/** free course (set in the admin panel, or a price of 0) */
export const isFreeCourse = (course: { price: number; isFree?: boolean }): boolean => course.isFree === true || course.price === 0;

/** "Free" or "₹2,999" */
export const coursePrice = (course: { price: number; isFree?: boolean }): string => (isFreeCourse(course) ? 'Free' : formatPrice(course.price));

/** 980 -> "980", 1200 -> "1.2K", 15000 -> "15K" */
export const formatCount = (value: number): string => {
  if (value < 1000) return String(value);
  const k = value / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
};

/** 2499 / 1499 -> 40 (percent off), or 0 when there is no discount */
export const discountPercent = (price: number, originalPrice?: number): number =>
  originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;