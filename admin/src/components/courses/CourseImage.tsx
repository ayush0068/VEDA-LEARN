import { useEffect, useState } from 'react';
import { mediaCandidates } from '@/services/courses.service';

/**
 * Picture of a course. A path like /images/courses/x.png lives in the website's public folder, so every
 * possible website address is tried in turn; `fallback` is shown when none of them has the picture.
 */
export default function CourseImage({ value, className, fallback }: { value: string; className?: string; fallback: React.ReactNode }) {
  const [tried, setTried] = useState(0);
  useEffect(() => setTried(0), [value]);

  const sources = value ? mediaCandidates(value) : [];
  if (tried >= sources.length) return <>{fallback}</>;
  return <img src={sources[tried]} alt="" loading="lazy" onError={() => setTried((n) => n + 1)} className={className} />;
}