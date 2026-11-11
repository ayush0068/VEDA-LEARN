const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDate = (iso?: string | null): string => (iso ? DATE.format(new Date(iso)) : '—');

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return 'Never';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const units: [number, string][] = [
    [60, 'min'],
    [60 * 60, 'hour'],
    [60 * 60 * 24, 'day'],
    [60 * 60 * 24 * 30, 'month'],
  ];
  for (let i = units.length - 1; i >= 0; i -= 1) {
    const [size, label] = units[i];
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${label}${n > 1 ? 's' : ''} ago`;
    }
  }
  return formatDate(iso);
};

export const rupees = (value: number): string => `₹${new Intl.NumberFormat('en-IN').format(value)}`;

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');