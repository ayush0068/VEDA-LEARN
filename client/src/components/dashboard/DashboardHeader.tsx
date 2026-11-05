import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/components/course/Avatar';
import { DASH_AVATAR_SRC, DASH_TOP_LINKS } from '@/constants/dashboard';
import { useAuth } from '@/context/AuthContext';
import type { DashNotification } from '@/utils/dashboardLogic';
import DashLogo from './DashLogo';

interface DashboardHeaderProps {
  cartCount: number;
  notifications: DashNotification[];
  seen: string[];
  onSeen: (ids: string[]) => void;
  onOpenMenu: () => void;
  /** the profile page shows only the photo + arrow (no name) */
  hideUserName?: boolean;
  /** page the header is on: the account menu offers the other one (Profile <-> Dashboard) + Log out */
  current?: 'dashboard' | 'profile';
}

/** Click outside / Escape closes a dropdown */
const useDismiss = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
};

export default function DashboardHeader({ cartCount, notifications, seen, onSeen, onOpenMenu, hideUserName = false, current = 'dashboard' }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const bellRef = useDismiss(bellOpen, () => setBellOpen(false));
  const userRef = useDismiss(userOpen, () => setUserOpen(false));

  const unread = notifications.filter((n) => !seen.includes(n.id));

  useEffect(() => {
    setBellOpen(false);
    setUserOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/courses?q=${encodeURIComponent(q)}`);
    setQuery('');
    setSearchOpen(false);
  };

  const toggleBell = () => {
    setBellOpen((open) => !open);
    setUserOpen(false);
  };
  // opening the bell marks what is listed as seen (the dot disappears, the list stays)
  useEffect(() => {
    if (bellOpen && unread.length) onSeen(unread.map((n) => n.id));
  }, [bellOpen, unread, onSeen]);

  const iconBtn = 'relative flex h-10 w-10 items-center justify-center rounded-full text-veda-brown transition-colors hover:bg-gold-pale/60';
  const name = user?.name ?? 'Student';

  return (
    <header className="sticky top-0 z-40 border-b border-gold/25 bg-ivory/95 backdrop-blur">
      <div className="flex h-[60px] items-center gap-3 px-3 sm:px-5 lg:px-6">
        <button type="button" onClick={onOpenMenu} aria-label="Open menu" className={`${iconBtn} lg:hidden`}>
          <Menu size={22} aria-hidden />
        </button>

        <div className="lg:w-[190px]">
          <DashLogo compact />
        </div>

        <nav aria-label="Main navigation" className="ml-4 hidden items-center gap-8 lg:flex">
          {DASH_TOP_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `relative py-1.5 text-[0.92rem] transition-colors ${isActive ? 'font-medium text-saffron' : 'text-veda-text hover:text-saffron'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} role="search" className="ml-auto hidden w-full max-w-[400px] lg:block">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-gold/35 bg-white/60 pl-4 pr-1.5 focus-within:border-gold">
            <span className="sr-only">Search courses, classes or topics</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, classes or topics..."
              className="min-w-0 flex-1 bg-transparent text-[0.85rem] text-veda-bark placeholder:text-veda-muted focus:outline-none"
            />
            <button type="submit" aria-label="Search" className="flex h-8 w-8 items-center justify-center rounded-lg text-veda-brown hover:bg-gold-pale/60">
              <Search size={18} aria-hidden />
            </button>
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Search" aria-expanded={searchOpen} className={`${iconBtn} lg:hidden`}>
            {searchOpen ? <X size={21} aria-hidden /> : <Search size={21} aria-hidden />}
          </button>

          {/* notifications */}
          <div ref={bellRef} className="relative">
            <button type="button" onClick={toggleBell} aria-label={`Notifications${unread.length ? `, ${unread.length} new` : ''}`} aria-expanded={bellOpen} className={iconBtn}>
              <Bell size={21} strokeWidth={1.6} aria-hidden />
              {unread.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-saffron ring-2 ring-ivory" />}
            </button>
            {bellOpen && (
              <div className="animate-fade-in absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-gold/25 bg-ivory p-2 shadow-xl">
                <p className="px-3 pb-1 pt-2 font-display text-[1.05rem] font-bold text-veda-bark">Notifications</p>
                {notifications.length ? (
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <Link to={n.to} className="block rounded-xl px-3 py-2.5 hover:bg-gold-pale/50">
                          <span className="block text-[0.85rem] font-medium text-veda-bark">{n.title}</span>
                          <span className="block truncate text-[0.8rem] text-veda-muted">{n.text}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-4 text-sm text-veda-muted">You’re all caught up.</p>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`} className={`${iconBtn} hidden sm:flex`}>
            <ShoppingCart size={21} strokeWidth={1.6} aria-hidden />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[0.62rem] font-semibold text-ivory">{cartCount}</span>
            )}
          </Link>

          {/* user menu */}
          <div ref={userRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => {
                setUserOpen((o) => !o);
                setBellOpen(false);
              }}
              aria-expanded={userOpen}
              aria-label="Account menu"
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 hover:bg-gold-pale/50 lg:pr-3"
            >
              <Avatar name={name} src={user?.avatar || DASH_AVATAR_SRC} className="h-9 w-9" />
              <span className={`${hideUserName ? 'hidden' : 'hidden lg:block'} text-left leading-tight`}>
                <span className="block max-w-[9rem] truncate text-[0.82rem] font-medium text-veda-bark">{name}</span>
                <span className="block text-[0.7rem] text-veda-muted">Student</span>
              </span>
              <ChevronDown size={15} className="hidden text-veda-brown lg:block" aria-hidden />
            </button>
            {userOpen && (
              <div role="menu" className="animate-fade-in absolute right-0 top-12 z-50 w-52 rounded-2xl border border-gold/25 bg-ivory p-1.5 shadow-xl">
                {current === 'profile' ? (
                  <Link role="menuitem" to="/dashboard" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-veda-text hover:bg-gold-pale/50">
                    <LayoutDashboard size={17} aria-hidden /> Dashboard
                  </Link>
                ) : (
                  <Link role="menuitem" to="/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-veda-text hover:bg-gold-pale/50">
                    <UserRound size={17} aria-hidden /> Profile
                  </Link>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-veda-text hover:bg-gold-pale/50"
                >
                  <LogOut size={17} aria-hidden /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* phone: search drops down under the header */}
      {searchOpen && (
        <form onSubmit={submit} role="search" className="animate-fade-in border-t border-gold/20 px-3 pb-3 pt-2 lg:hidden">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-gold/35 bg-white/70 pl-4 pr-1.5 focus-within:border-gold">
            <span className="sr-only">Search courses, classes or topics</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, classes or topics..."
              className="min-w-0 flex-1 bg-transparent text-sm text-veda-bark placeholder:text-veda-muted focus:outline-none"
            />
            <button type="submit" aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-lg text-veda-brown">
              <Search size={18} aria-hidden />
            </button>
          </label>
        </form>
      )}
    </header>
  );
}