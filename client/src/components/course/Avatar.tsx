import { useEffect, useState } from 'react';

interface AvatarProps {
  name: string;
  /** photo from client/public (falls back to the initials when the file is missing) */
  src?: string;
  className?: string;
  textClass?: string;
}

/** Round photo, or the person's initials on a gold circle when there is no photo. */
export default function Avatar({ name, src, className = 'h-10 w-10', textClass = 'text-sm' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const initials = name
    .replace(/^(Acharya|Dr\.|Smt\.|Shri|Pt\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src && !failed) {
    return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-saffron font-semibold text-veda-bark ${className} ${textClass}`}
      role="img"
      aria-label={name}
    >
      {initials}
    </span>
  );
}