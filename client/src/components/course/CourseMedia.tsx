import { Bookmark, BookmarkCheck, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import Mandala from '@/components/common/Mandala';
import { getIcon } from '@/constants/icons';
import type { Course } from '@/types';

interface CourseMediaProps {
  course: Course;
  saved: boolean;
  onToggleSaved: () => void;
  onPreview: () => void;
}

/** Big course picture with the play button, "Preview Course" pill and bookmark. */
export default function CourseMedia({ course, saved, onToggleSaved, onPreview }: CourseMediaProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [course.image]);
  const Icon = getIcon(course.icon);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-gold/25 bg-cream shadow-[0_24px_50px_-28px_rgba(90,45,15,0.55)]">
      {course.image && !failed ? (
        <img src={course.image} alt={course.title} onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-veda-bark via-veda-brown to-saffron">
          <Mandala className="absolute inset-0 m-auto h-[120%] w-[120%] text-ivory/20" />
          <Icon size={72} strokeWidth={1.1} className="relative text-ivory/90" aria-hidden />
        </div>
      )}

      {/* soft shade so the white controls stay readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-veda-bark/45 via-transparent to-veda-bark/10" aria-hidden />

      <button
        type="button"
        onClick={onPreview}
        aria-label="Play course preview"
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-veda-bark/45 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-veda-bark/65 sm:h-[4.5rem] sm:w-[4.5rem]"
      >
        <Play size={28} className="ml-1 fill-white" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onPreview}
        className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-white/50 bg-veda-bark/60 px-3 py-1.5 text-[0.78rem] font-medium text-white backdrop-blur-sm transition-colors hover:bg-veda-bark/80"
      >
        <Play size={12} className="fill-white" aria-hidden /> Preview Course
      </button>

      <button
        type="button"
        onClick={onToggleSaved}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved courses' : 'Save this course'}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-ivory/90 text-veda-brown shadow-sm backdrop-blur-sm transition-colors hover:bg-ivory"
      >
        {saved ? <BookmarkCheck size={19} className="fill-gold-pale text-saffron" aria-hidden /> : <Bookmark size={19} aria-hidden />}
      </button>
    </div>
  );
}