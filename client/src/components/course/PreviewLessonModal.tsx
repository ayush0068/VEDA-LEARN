import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import LessonMedia from '@/components/learn/LessonMedia';
import { getPreviewLesson } from '@/services/learning.service';
import type { LessonDetail } from '@/types/learning';

/** Plays a FREE PREVIEW lesson of a course (video / article / PDF) for anyone, signed in or not. */
export default function PreviewLessonModal({ slug, lessonId, onClose }: { slug: string; lessonId: string | null; onClose: () => void }) {
  const [data, setData] = useState<Pick<LessonDetail, 'course' | 'module' | 'lesson'> | null>(null);
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!lessonId) return;
    let alive = true;
    setData(null);
    setError('');
    getPreviewLesson(slug, lessonId)
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message || 'Could not load this lesson'));
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [slug, lessonId, onClose]);

  if (!lessonId) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-veda-bark/75 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label="Free preview lesson" onClick={onClose}>
      <div className="relative my-auto w-full max-w-3xl rounded-2xl bg-ivory p-3 shadow-soft sm:p-4" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview" className="absolute right-3 top-3 z-10 rounded-full bg-ivory/90 p-1.5 text-veda-brown shadow hover:bg-gold-pale">
          <X size={20} />
        </button>
        {error ? (
          <p role="alert" className="px-4 py-10 text-center text-[0.92rem] text-red-700">
            {error}
          </p>
        ) : !data ? (
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-gold-pale/60" aria-busy="true" />
        ) : (
          <>
            <LessonMedia lesson={data.lesson} onVideoEnded={() => undefined} />
            <div className="px-1 pb-1 pt-3">
              <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-saffron">
                Free preview · Module {data.module.number}: {data.module.title}
              </p>
              <h2 className="mt-1 font-display text-[1.3rem] font-bold text-veda-bark">{data.lesson.title}</h2>
              {data.lesson.description && <p className="mt-1 text-[0.9rem] text-veda-text">{data.lesson.description}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}