import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** blocks Esc / backdrop close while a request is running */
  busy?: boolean;
  /** 'dialog' = centred card (bottom sheet on phones), 'drawer' = panel from the right (full screen on phones) */
  variant?: 'dialog' | 'drawer';
  width?: string;
}

/** Locks page scroll, closes with Esc / backdrop, and puts focus inside when it opens. */
export default function Modal({ open, onClose, title, subtitle, children, footer, busy = false, variant = 'dialog', width = 'max-w-md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const previouslyFocused = document.activeElement as HTMLElement | null;
    window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input:not([disabled]), textarea, select, [data-autofocus]');
      (first ?? panelRef.current)?.focus({ preventScroll: true });
    }, 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const isDrawer = variant === 'drawer';

  return (
    <div className={`fixed inset-0 z-[80] flex animate-fade-in ${isDrawer ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-4'}`}>
      <button type="button" aria-label="Close" tabIndex={-1} onClick={() => !busy && onClose()} className="absolute inset-0 cursor-default bg-veda-bark/45" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col bg-ivory shadow-2xl shadow-veda-bark/30 focus:outline-none ${
          isDrawer
            ? 'h-full max-h-none max-w-[460px] animate-drawer-in border-l border-line'
            : `${width} animate-sheet-in rounded-t-3xl border border-line sm:animate-pop-in sm:rounded-2xl`
        }`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/70 px-5 pb-3.5 pt-4">
          <div className="min-w-0">
            <h2 className="font-display text-[1.2rem] font-bold leading-tight text-veda-bark">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[0.8rem] text-veda-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-veda-muted transition hover:bg-cream hover:text-veda-bark disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <footer className="border-t border-line/70 bg-cream/40 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{footer}</footer>}
      </div>
    </div>
  );
}