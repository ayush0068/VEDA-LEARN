import { ArrowRight, Search, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { useSearch } from '@/context/SearchContext';
import { useSearchData } from '@/hooks/useSearchData';
import { readRecent, writeRecent } from '@/utils/search';
import { IdlePanel, ResultsPanel } from './SearchPanels';

const OPEN_MS = 600;
const CLOSE_MS = 440;
const OPEN_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const CLOSE_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const RISE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Origin {
  x: number;
  y: number;
  size: number;
}

/** Centre of the button the search grew out of (falls back to any visible search button, then the top right). */
const findOrigin = (origin: HTMLElement | null): Origin => {
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

  return rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: Math.min(rect.width, rect.height) }
    : { x: window.innerWidth - 48, y: 36, size: 40 };
};

/** Smallest circle (centred on the origin) that covers the whole viewport. */
const coverRadius = (x: number, y: number, w: number, h: number) => Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;

/** current scale / opacity of an element mid-animation (so a quick close continues from where the open was) */
const currentScale = (el: HTMLElement | null): number => {
  if (!el) return 1;
  const t = getComputedStyle(el).transform;
  return t && t !== 'none' ? new DOMMatrixReadOnly(t).a : 1;
};
const currentOpacity = (el: HTMLElement | null): number => (el ? parseFloat(getComputedStyle(el).opacity) || 0 : 1);

/**
 * Full-screen glass search page.
 *
 * Smoothness: the circle reveal is a *scaled circle layer* (transform) and everything else only fades / slides
 * (opacity + transform), so the browser animates it on the GPU and nothing is re-blurred per frame. The heavy
 * frosted blur is faded in only after the circle has finished growing (and removed before it shrinks).
 * The page stays mounted (hidden) so opening does no React / image work.
 */
export default function SearchOverlay() {
  const { isOpen, closeSearch, originRef } = useSearch();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animRef = useRef<Animation[]>([]);
  const wasOpen = useRef(false);

  const { overview, results, loading } = useSearchData(query, isOpen);

  const cancelAnimations = () => {
    animRef.current.forEach((a) => a.cancel());
    animRef.current = [];
  };

  /** places the big circle layer on the button and returns its start scale */
  const placeCircle = (o: Origin) => {
    const root = rootRef.current!;
    const circle = circleRef.current!;
    const box = root.getBoundingClientRect();
    const r = coverRadius(o.x - box.left, o.y - box.top, box.width, box.height);

    circle.style.width = `${r * 2}px`;
    circle.style.height = `${r * 2}px`;
    circle.style.left = `${o.x - box.left - r}px`;
    circle.style.top = `${o.y - box.top - r}px`;

    return Math.min(1, Math.max(o.size, 28) / (r * 2));
  };

  const setHints = (on: boolean) => {
    [circleRef, glowRef, bodyRef].forEach((ref) => {
      if (ref.current) ref.current.style.willChange = on ? 'transform, opacity' : '';
    });
  };

  // ---------- open / close ----------
  useLayoutEffect(() => {
    const root = rootRef.current;
    const circle = circleRef.current;
    const blur = blurRef.current;
    const glow = glowRef.current;
    const body = bodyRef.current;
    if (!root || !circle || !blur || !glow || !body) return;

    // OPEN -------------------------------------------------------------------------------------
    if (isOpen) {
      wasOpen.current = true;
      cancelAnimations();
      root.style.visibility = 'visible';
      root.style.pointerEvents = 'auto';
      setRecent(readRecent());

      if (reduceMotion()) {
        circle.style.width = '100%';
        circle.style.height = '100%';
        circle.style.left = '0';
        circle.style.top = '0';
        circle.style.borderRadius = '0';
        blur.style.opacity = '1';
        inputRef.current?.focus({ preventScroll: true });
        return;
      }

      circle.style.borderRadius = '9999px';
      blur.style.transitionDuration = '0ms';
      blur.style.opacity = '0';
      setHints(true);

      const s0 = placeCircle(findOrigin(originRef.current));
      const anims: Animation[] = [];

      const grow = circle.animate([{ transform: `scale(${s0})` }, { transform: 'scale(1)' }], {
        duration: OPEN_MS,
        easing: OPEN_EASE,
        fill: 'backwards',
      });
      anims.push(grow);
      anims.push(
        glow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 120, easing: 'ease-out', fill: 'backwards' }),
        body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 110, easing: 'ease-out', fill: 'backwards' }),
      );

      Array.from(root.querySelectorAll<HTMLElement>('[data-rise]'))
        .slice(0, 9)
        .forEach((el, i) => {
          anims.push(
            el.animate(
              [
                { opacity: 0, transform: 'translateY(16px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 420, delay: 150 + i * 45, easing: RISE_EASE, fill: 'backwards' },
            ),
          );
        });

      animRef.current = anims;

      grow.onfinish = () => {
        setHints(false);
        // frosted blur fades in only now that nothing is moving any more
        blur.style.transitionDuration = '320ms';
        blur.style.opacity = '1';
        inputRef.current?.focus({ preventScroll: true });
      };
      return;
    }

    // CLOSE ------------------------------------------------------------------------------------
    if (!wasOpen.current) return;
    wasOpen.current = false;
    inputRef.current?.blur();
    root.style.pointerEvents = 'none';

    const hide = () => {
      cancelAnimations();
      setHints(false);
      root.style.visibility = '';
      blur.style.transitionDuration = '0ms';
      blur.style.opacity = '0';
      circle.style.borderRadius = '9999px';
      setQuery('');
      setActiveIndex(-1);
    };

    if (reduceMotion()) {
      hide();
      return;
    }

    // continue from wherever an interrupted open had got to
    const fromScale = currentScale(circle);
    const fromBody = currentOpacity(body);
    const fromGlow = currentOpacity(glow);
    cancelAnimations();
    setHints(true);

    const target = originRef.current;
    const s0 = placeCircle(findOrigin(target));

    // blur goes first (quick), then the circle folds into the button
    blur.style.transitionDuration = '140ms';
    blur.style.opacity = '0';

    const shrink = circle.animate(
      [
        { transform: `scale(${fromScale})`, opacity: 1, offset: 0 },
        { transform: `scale(${s0})`, opacity: 1, offset: 0.86 },
        { transform: `scale(${s0})`, opacity: 0, offset: 1 },
      ],
      { duration: CLOSE_MS, delay: 60, easing: CLOSE_EASE, fill: 'forwards' },
    );
    animRef.current = [
      shrink,
      body.animate([{ opacity: fromBody }, { opacity: 0 }], { duration: 150, easing: 'ease-in', fill: 'forwards' }),
      glow.animate([{ opacity: fromGlow }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' }),
    ];

    shrink.onfinish = () => {
      hide();
      // little "pop" on the button the page merged into
      if (target?.isConnected) {
        target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.28)' }, { transform: 'scale(1)' }], {
          duration: 320,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ---------- page behaviour while open ----------
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && closeSearch();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeSearch]);

  // keeps the pill above the phone keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!isOpen || !vv) return;
    const sync = () => setViewport({ top: vv.offsetTop, height: vv.height });
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, [isOpen]);

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

  const hasQuery = query.trim().length > 0;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search VedaLearn"
      style={viewport ? { top: viewport.top, height: viewport.height } : { top: 0, height: '100dvh' }}
      className="invisible fixed left-0 z-[70] w-full overflow-hidden overscroll-contain"
    >
      {/* 1. the circle that grows out of the button (plain tinted layer: only `transform` is animated) */}
      <div
        ref={circleRef}
        aria-hidden
        className="absolute rounded-full bg-ivory/80 shadow-[0_0_0_1px_rgba(197,139,43,0.22)]"
      />

      {/* 2. frosted-glass blur, faded in once the circle has settled */}
      <div
        ref={blurRef}
        aria-hidden
        style={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-150 transition-opacity ease-out"
      />

      {/* 3. soft colour glows + mandala (cheap gradients, no blur filters) */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(38rem 30rem at 0% 0%, rgba(197,139,43,0.26), transparent 70%),' +
            'radial-gradient(30rem 26rem at 100% 38%, rgba(194,106,27,0.15), transparent 70%),' +
            'radial-gradient(34rem 28rem at 30% 100%, rgba(227,194,133,0.30), transparent 70%)',
        }}
      >
        <Mandala className="absolute -right-32 -top-32 h-[28rem] w-[28rem] text-gold/20" />
      </div>

      {/* 4. content */}
      <div ref={bodyRef} className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
          <div className="mx-auto max-w-3xl">
            {!hasQuery && (
              <header data-rise className="mb-6 sm:mb-7">
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
        <div
          data-rise
          className="touch-none bg-gradient-to-t from-ivory/70 via-ivory/30 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2.5">
            <form
              onSubmit={onSubmit}
              role="search"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/80 bg-white/70 py-1.5 pl-4 pr-1.5 shadow-[0_10px_30px_-12px_rgba(90,45,15,0.45)] transition focus-within:border-gold/70 focus-within:ring-2 focus-within:ring-gold/30"
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/70 text-veda-brown shadow-[0_10px_30px_-12px_rgba(90,45,15,0.45)] transition hover:bg-white/90"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}