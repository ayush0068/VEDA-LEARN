import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { previewVideo } from '@/utils/courseFormat';

interface PreviewModalProps {
  open: boolean;
  courseSlug: string;
  title: string;
  /** uploaded file or link from the admin panel (mp4 / webm / YouTube). Empty = public/videos/previews/<slug>.mp4 */
  videoUrl?: string;
  onClose: () => void;
}

const youtubeId = (url: string): string | undefined => /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url)?.[1];

/** Plays the course preview video set in the admin panel (or public/videos/previews/<course-slug>.mp4). */
export default function PreviewModal({ open, courseSlug, title, videoUrl, onClose }: PreviewModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFailed(false);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const src = videoUrl || previewVideo(courseSlug);
  const youtube = videoUrl ? youtubeId(videoUrl) : undefined;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-veda-bark/75 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} preview`}
      onClick={onClose}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-ivory shadow-soft" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-3 top-3 z-10 rounded-full bg-ivory/90 p-1.5 text-veda-brown hover:bg-gold-pale"
        >
          <X size={20} />
        </button>

        <div className="aspect-video w-full bg-cream">
          {youtube ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0`}
              title={`${title} preview`}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : !failed ? (
            <video
              src={src}
              className="h-full w-full bg-black object-contain"
              controls
              autoPlay
              playsInline
              preload="metadata"
              onError={() => setFailed(true)}
              aria-label={`${title} preview`}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="font-display text-2xl text-veda-brown">Preview coming soon</p>
              <p className="max-w-sm text-sm text-veda-muted">The preview video for this course will be available soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}