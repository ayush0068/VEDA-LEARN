import { useState } from 'react';
import Mandala from '@/components/common/Mandala';
import { getIcon } from '@/constants/icons';
import type { Course } from '@/types';

const FALLBACK_BG = [
  'from-veda-bark to-veda-brown',
  'from-gold-soft to-saffron',
  'from-veda-brown to-saffron',
  'from-saffron to-gold',
];

/** Course picture that falls back to a coloured mandala + icon when the image file is missing. */
export default function CourseThumb({ course, index, className = '' }: { course: Course; index: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = getIcon(course.icon);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {course.image && !failed ? (
        <img
          src={course.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${FALLBACK_BG[index % FALLBACK_BG.length]}`}>
          <Mandala className="absolute inset-0 m-auto h-[130%] w-[130%] text-ivory/20" />
          <Icon size={34} strokeWidth={1.3} className="relative text-ivory" aria-hidden />
        </div>
      )}
    </div>
  );
}

/** Round avatar with the teacher's initials (no teacher photos yet). */
export function InstructorBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .replace(/^(Acharya|Dr\.|Smt\.|Shri|Pt\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-saffron font-semibold text-veda-bark ${
        size === 'sm' ? 'h-5 w-5 text-[0.55rem]' : 'h-7 w-7 text-[0.68rem]'
      }`}
      aria-hidden
    >
      {initials}
    </span>
  );
}