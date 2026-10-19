import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { env } from '@/config/env';

interface IntroModalProps {
  open: boolean;
  onClose: () => void;
}

export default function IntroModal({ open, onClose }: IntroModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-veda-bark/70 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="VedaLearn introduction video"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-ivory shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-ivory/90 p-1.5 text-veda-brown hover:bg-gold-pale"
          aria-label="Close video"
        >
          <X size={20} />
        </button>

        <div className="aspect-video w-full bg-cream">
          {env.introVideoUrl ? (
            <iframe
              src={env.introVideoUrl}
              title="VedaLearn introduction"
              className="h-full w-full"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="font-display text-2xl text-veda-brown">Intro video coming soon</p>
              <p className="max-w-sm text-sm text-veda-muted">
                Add an embed link as <code className="rounded bg-gold-pale px-1">VITE_INTRO_VIDEO_URL</code> in
                client/.env to play it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
