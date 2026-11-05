import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const INTRO_MS = 5000; // how long "Search here" stays open
const STILL_MS = 500; // the page must stay still at the top this long before the intro starts
const TOP_PX = 40;

// the intro plays once per page load (a refresh plays it again)
let introPlayed = false;

type Phase = 'hidden' | 'open' | 'icon';

/**
 * Phones / tablets only, signed-in users only. The navbar search icon is replaced by a round search button at
 * the bottom right. On the home page, once the page is still at the top, it slides in from its side (right by default) as
 * "Search here" for 5 seconds and then shrinks to the icon. Tapping it opens a search bar at the bottom.
 */
export default function MobileSearchFab() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  const [phase, setPhase] = useState<Phase>(() => (isHome && !introPlayed && window.scrollY < TOP_PX ? 'hidden' : 'icon'));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // intro on the home page
  useEffect(() => {
    if (!user || !isHome || introPlayed) return;

    let still: number | undefined;
    let close: number | undefined;

    const start = () => {
      if (introPlayed || window.scrollY >= TOP_PX) return;
      introPlayed = true;
      window.removeEventListener('scroll', onScroll);
      setPhase('open');
      close = window.setTimeout(() => setPhase('icon'), INTRO_MS);
    };
    const onScroll = () => {
      window.clearTimeout(still);
      if (window.scrollY >= TOP_PX) setPhase((p) => (p === 'hidden' ? 'icon' : p));
      still = window.setTimeout(start, STILL_MS);
    };

    still = window.setTimeout(start, 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(still);
      window.clearTimeout(close);
      window.removeEventListener('scroll', onScroll);
    };
  }, [user, isHome]);

  // scrolling away while it is open folds it up at once
  useEffect(() => {
    if (phase !== 'open') return;
    const onScroll = () => window.scrollY >= TOP_PX && setPhase('icon');
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [phase]);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  if (!user) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/courses?q=${encodeURIComponent(q)}`);
    setQuery('');
    setSheetOpen(false);
  };

  // pages with their own bottom bar (course page, live classes) get the button a little higher
  const raised = pathname.startsWith('/courses/') || pathname.startsWith('/live-classes');
  const open = phase === 'open';
  const left = user.searchSide === 'left'; // set in Profile > Privacy & Settings (for left-handed use)

  return (
    <div className="lg:hidden">
      {sheetOpen ? (
        <div className="fixed inset-0 z-[55]">
          <button type="button" aria-label="Close search" onClick={() => setSheetOpen(false)} className="animate-fade-in absolute inset-0 bg-veda-bark/30" />
          <form
            onSubmit={onSubmit}
            role="search"
            className="animate-rise-in absolute inset-x-3 bottom-4 flex items-center gap-2 rounded-full border border-gold/40 bg-ivory py-1.5 pl-4 pr-1.5 shadow-xl shadow-veda-brown/25"
          >
            <Search size={18} className="shrink-0 text-veda-muted" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Vedic Astrology, Vastu, Gita…"
              aria-label="Search courses"
              className="min-w-0 flex-1 bg-transparent py-2 text-[0.92rem] text-veda-bark placeholder:text-veda-muted focus:outline-none"
            />
            <button type="submit" className="btn-primary rounded-full px-4 py-2">
              Search
            </button>
            <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close search" className="flex h-9 w-9 items-center justify-center rounded-full text-veda-brown hover:bg-gold-pale/60">
              <X size={18} aria-hidden />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Search courses"
          className={`fixed z-50 flex h-12 items-center overflow-hidden rounded-full bg-veda-brown text-ivory shadow-lg shadow-veda-brown/30 transition-[transform,opacity] duration-500 ease-out ${
            left ? 'left-4 flex-row-reverse' : 'right-4'
          } ${raised ? 'bottom-24' : 'bottom-5'} ${
            phase === 'hidden'
              ? `pointer-events-none opacity-0 ${left ? '-translate-x-[140%]' : 'translate-x-[140%]'}`
              : 'translate-x-0 opacity-100'
          }`}
        >
          <span
            className={`overflow-hidden whitespace-nowrap text-[0.9rem] font-medium transition-[max-width,padding,opacity] duration-500 ease-out ${
              open ? `max-w-[9rem] opacity-100 ${left ? 'pr-5' : 'pl-5'}` : 'max-w-0 p-0 opacity-0'
            }`}
          >
            Search here
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center">
            <Search size={20} aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}