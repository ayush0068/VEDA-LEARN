import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSearch } from '@/context/SearchContext';

const INTRO_MS = 5000; // how long "Search here" stays open
const STILL_MS = 500; // the page must stay still at the top this long before the intro starts
const TOP_PX = 40;

// the intro plays once per page load (a refresh plays it again)
let introPlayed = false;

type Phase = 'hidden' | 'open' | 'icon';

/**
 * Phones / tablets only, signed-in users only. The navbar search icon is replaced by a round search button at
 * the bottom right. On the home page, once the page is still at the top, it slides in from its side (right by default) as
 * "Search here" for 5 seconds and then shrinks to the icon. Tapping it opens the full-screen glass search page (it grows out of this button and folds back into it).
 */
export default function MobileSearchFab() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { openSearch } = useSearch();
  const isHome = pathname === '/';

  const [phase, setPhase] = useState<Phase>(() => (isHome && !introPlayed && window.scrollY < TOP_PX ? 'hidden' : 'icon'));

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

  if (!user) return null;

  // pages with their own bottom bar (course page, live classes) get the button a little higher
  const raised = pathname.startsWith('/courses/') || pathname.startsWith('/live-classes');
  const open = phase === 'open';
  const left = user.searchSide === 'left'; // set in Profile > Privacy & Settings (for left-handed use)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        data-search-trigger
        onClick={(e) => openSearch(e.currentTarget.querySelector<HTMLElement>('[data-search-icon]') ?? e.currentTarget)}
        aria-label="Search courses"
        aria-haspopup="dialog"
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
        <span data-search-icon className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          <Search size={20} aria-hidden />
        </span>
      </button>
    </div>
  );
}