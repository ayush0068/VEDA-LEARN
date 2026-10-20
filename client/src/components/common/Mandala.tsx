// Thin-line decorative mandala. Colour comes from `currentColor` (set it with a text-* class).
const PETALS = 12;

export default function Mandala({ className = '' }: { className?: string }) {
  const angles = Array.from({ length: PETALS }, (_, i) => (360 / PETALS) * i);

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden>
      <circle cx="100" cy="100" r="97" />
      <circle cx="100" cy="100" r="90" strokeDasharray="1.5 3" />
      {angles.map((a) => (
        <ellipse key={`o${a}`} cx="100" cy="52" rx="11" ry="34" transform={`rotate(${a} 100 100)`} />
      ))}
      {angles.map((a) => (
        <ellipse key={`i${a}`} cx="100" cy="74" rx="6" ry="18" transform={`rotate(${a + 15} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="36" />
      <circle cx="100" cy="100" r="22" />
      <circle cx="100" cy="100" r="8" />
    </svg>
  );
}