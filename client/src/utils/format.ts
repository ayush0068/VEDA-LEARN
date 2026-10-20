/** 2999 -> "₹2,999" */
export const formatPrice = (amount: number): string =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;

/** 980 -> "980", 1200 -> "1.2K", 15000 -> "15K" */
export const formatCount = (value: number): string => {
  if (value < 1000) return String(value);
  const k = value / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
};