import { ArrowRight, Search, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { useSearch } from '@/context/SearchContext';
import { useSearchData } from '@/hooks/useSearchData';
import { readRecent, writeRecent } from '@/utils/search';
import { IdlePanel, ResultsPanel } from './SearchPanels';

const OPEN_MS = 560;
const CLOSE_MS = 460;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Point {
  x: number;
  y: number;
}

/** Centre of the button the search grew out of (falls back to any visible search button, then the top right). */
const findOrigin = (origin: HTMLElement | null): Point => {
  const usable = (el: Element | null | undefined) => {
    if (!el || !el.isConnected) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  };

  const rect =
    usable(origin) ??
    Array.from(document.querySelectorAll('[data-search-trigger]'))
      .map((el) => usable(el))
      .find(Boolean) ??
    null;

  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth - 48, y: 36 };
};

/** Smallest circle (centred on `p`) that covers the whole viewport. */
const coverRadius = (p: Point, w: number, h: number) => Math.hypot(Math.max(p.x, w - p.x), Math.max(p.y, h - p.y)) + 2;

/**
 * Full-screen glass search page. It opens with a circular reveal from the search button (like Telegram's theme
 * switch) and, when closed, shrinks back into that same button.
 */
export default function SearchOverlay() {
  const { isOpen, closeSearch, originRef } = useSearch();
  const navigate = useNavigate();

  const [shown, setShown] = useState(false); // mounted (stays true while the close animation plays)
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animRef = useRef<Animation[]>([]);
  const lastOrigin = useRef<Point>({ x: 0, y: 0 });

  const { overview, results, loading } = useSearchData(query, isOpen);

  // ---------- mount / unmount around the animations ----------
  useLayoutEffect(() => {
    if (isOpen && !shown) setShown(true);
  }, [isOpen, shown]);

  const cancelAnimations = () => {
    animRef.current.forEach((a) => a.cancel());
    animRef.current = [];
  };

  // open: circle grows from the button
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!isOpen || !shown || !root) return;

    cancelAnimations();
    setRecent(readRecent());

    const box = root.getBoundingClientRect();
    const o = findOrigin(originRef.current);
    const p = { x: o.x - box.left, y: o.y - box.top };
    lastOrigin.current = o;
    const r = coverRadius(p, box.width, box.height);

    if (reduceMotion()) {
      inputRef.current?.focus();
      return;
    }

    const grow = root.animate(
      [{ clipPath: `circle(0px at ${p.x}px ${p.y}px)` }, { clipPath: `circle(${r}px at ${p.x}px ${p.y}px)` }],
      { duration: OPEN_MS, easing: 'cubic-bezier(0.22, 0.9, 0.3, 1)', fill: 'both' },
    );
    const body = bodyRef.current?.animate(
      [
        { opacity: 0, transform: 'translateY(26px) scale(0.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: OPEN_MS, delay: 110, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
    );
    animRef.current = body ? [grow, body] : [grow];

    grow.onfinish = () => {
      // drop the clip once fully open (cheaper blur, no edge artefacts)
      root.style.clipPath = 'none';
      cancelAnimations();
      inputRef.current?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, shown]);

  // close: circle folds back into the button
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (isOpen || !shown || !root) return;

    cancelAnimations();
    inputRef.current?.blur();

    const finish = () => {
      cancelAnimations();
      root.style.clipPath = '';
      setShown(false);
      setQuery('');
      setActiveIndex(-1);
    };

    if (reduceMotion()) {
      finish();
      return;
    }

    const box = root.getBoundingClientRect();
    const o = findOrigin(originRef.current) ?? lastOrigin.current;
    const p = { x: o.x - box.left, y: o.y - box.top };
    const r = coverRadius(p, box.width, box.height);

    root.style.clipPath = `circle(${r}px at ${p.x}px ${p.y}px)`;
    const shrink = root.animate(
      [{ clipPath: `circle(${r}px at ${p.x}px ${p.y}px)` }, { clipPath: `circle(0px at ${p.x}px ${p.y}px)` }],
      { duration: CLOSE_MS, easing: 'cubic-bezier(0.55, 0.05, 0.75, 0.4)', fill: 'both' },
    );
    const body = bodyRef.current?.animate(
      [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(18px) scale(0.98)' },
      ],
      { duration: CLOSE_MS * 0.55, easing: 'ease-in', fill: 'both' },
    );
    animRef.current = body ? [shrink, body] : [shrink];

    shrink.onfinish = () => {
      finish();
      // little "pop" on the button the page merged into
      const target = originRef.current;
      if (target?.isConnected && !reduceMotion()) {
        target.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.28)' }, { transform: 'scale(1)' }],
          { duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, shown]);

  // ---------- page behaviour while open ----------
  useEffect(() => {
    if (!shown) return;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [shown]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && closeSearch();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeSearch]);

  // keeps the pill above the phone keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!shown || !vv) return;
    const sync = () => setViewport({ top: vv.offsetTop, height: vv.height });
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, [shown]);

  useEffect(() => setActiveIndex(-1), [results]);

  // ---------- actions ----------
  const remember = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
      writeRecent(next);
      return next;
    });
  }, []);

  const pickTerm = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    writeRecent([]);
    setRecent([]);
  };

  const onPick = () => {
    remember(query);
    closeSearch();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    const chosen = activeIndex >= 0 ? results?.[activeIndex] : undefined;
    remember(q);
    navigate(chosen ? `/courses/${chosen.slug}` : `/courses?q=${encodeURIComponent(q)}`);
    closeSearch();
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length === 0) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    e.preventDefault();
    const last = results.length - 1;
    const next = e.key === 'ArrowDown' ? (activeIndex >= last ? 0 : activeIndex + 1) : activeIndex <= 0 ? last : activeIndex - 1;
    setActiveIndex(next);
    document.getElementById(`search-result-${next}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  if (!shown) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search VedaLearn"
      style={viewport ? { top: viewport.top, height: viewport.height } : { top: 0, height: '100dvh' }}
      className="fixed left-0 z-[70] w-full overflow-hidden bg-ivory/60 backdrop-blur-2xl backdrop-saturate-150"
    >
      {/* soft glass glows + a slow mandala so the blur has something to play with */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-saffron/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-gold-soft/30 blur-3xl" />
        <Mandala className="absolute -right-32 -top-32 h-[28rem] w-[28rem] animate-spin-slow text-gold/20" />
      </div>

      <div ref={bodyRef} className="relative flex h-full flex-col">
        {/* results scroll here; the pill below stays put */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
          <div className="mx-auto max-w-3xl">
            {!hasQuery && (
              <header className="mb-6 animate-rise-in sm:mb-7">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-saffron">Search</p>
                <h2 className="mt-1 font-display text-[1.7rem] font-semibold leading-tight text-veda-bark sm:text-4xl">
                  What would you like to learn?
                </h2>
                <p className="mt-1.5 text-sm text-veda-muted">Courses, teachers and topics. No login needed.</p>
              </header>
            )}

            {hasQuery ? (
              <ResultsPanel
                query={query.trim()}
                results={results}
                loading={loading}
                activeIndex={activeIndex}
                trending={overview.trending}
                onTerm={pickTerm}
                onPick={onPick}
                onSeeAll={onPick}
              />
            ) : (
              <IdlePanel
                recent={recent}
                trending={overview.trending}
                suggested={overview.suggested}
                onTerm={pickTerm}
                onClearRecent={clearRecent}
                onPick={onPick}
                onTopic={closeSearch}
              />
            )}
          </div>
        </div>

        {/* search pill */}
        <div className="bg-gradient-to-t from-ivory/70 via-ivory/30 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center gap-2.5">
            <form
              onSubmit={onSubmit}
              role="search"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/80 bg-white/60 py-1.5 pl-4 pr-1.5 shadow-[0_14px_40px_-12px_rgba(90,45,15,0.45)] backdrop-blur-xl transition focus-within:border-gold/70 focus-within:ring-2 focus-within:ring-gold/30"
            >
              <Search size={19} className="shrink-0 text-veda-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={80}
                placeholder="Search Vedic Astrology, Vastu, Gita…"
                aria-label="Search courses"
                className="min-w-0 flex-1 bg-transparent py-2 text-base text-veda-bark placeholder:text-veda-muted/80 focus:outline-none"
              />
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-veda-muted transition hover:bg-gold-pale/60 hover:text-veda-bark"
                >
                  <X size={16} aria-hidden />
                </button>
              )}
              <button
                type="submit"
                disabled={!hasQuery}
                aria-label="Search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-veda-brown text-ivory transition hover:bg-veda-bark disabled:opacity-40"
              >
                <ArrowRight size={18} aria-hidden />
              </button>
            </form>

            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/60 text-veda-brown shadow-[0_14px_40px_-12px_rgba(90,45,15,0.45)] backdrop-blur-xl transition hover:bg-white/80"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}