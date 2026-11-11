import { Bell, ChevronDown, ExternalLink, LogOut, Menu, Search, Settings, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminAvatar } from '@/components/common/Art';
import { env } from '@/config/env';
import { useAuth } from '@/context/AuthContext';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false); // phones: search field slides in under the bar
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ctrl/Cmd + K focuses the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus();
        else setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) mobileInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [menuOpen]);

  const field =
    'w-full rounded-xl border border-line bg-white/70 py-2.5 pl-10 text-[0.9rem] text-veda-bark placeholder:text-veda-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25';

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-[#FCEFDC]/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-veda-brown transition hover:bg-white/60 lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* search (md and up) */}
        <div className="relative hidden max-w-[600px] flex-1 md:block">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-bark" aria-hidden />
          <input ref={inputRef} type="search" placeholder="Search anything... (courses, students, orders, etc.)" aria-label="Search" className={`${field} pr-20`} />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-white/80 px-2 py-0.5 font-sans text-[0.72rem] font-semibold text-veda-bark">
            Ctrl + K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-veda-brown transition hover:bg-white/60 md:hidden"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <a
            href={env.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-xl border border-gold/50 bg-white/60 px-4 py-2.5 text-[0.88rem] font-semibold text-veda-bark shadow-sm transition hover:bg-white sm:inline-flex"
          >
            <ExternalLink size={16} aria-hidden />
            View Website
          </a>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-veda-brown transition hover:bg-white/60"
          >
            <Bell size={22} strokeWidth={1.7} />
            <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#FCEFDC] bg-red-500" />
          </button>

          <div ref={menuRef} className="relative border-l border-line pl-2 sm:pl-4">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-white/50"
            >
              <span className="block h-10 w-10 overflow-hidden rounded-full border-2 border-gold/60 sm:h-11 sm:w-11">
                <AdminAvatar className="h-full w-full" />
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[9rem] truncate text-[0.95rem] font-semibold text-veda-bark">{user?.name ?? 'Admin'}</span>
                <span className="block text-[0.8rem] text-veda-muted">Administrator</span>
              </span>
              <ChevronDown size={16} className={`hidden text-veda-bark transition sm:block ${menuOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-52 animate-fade-in overflow-hidden rounded-2xl border border-line bg-ivory p-1.5 shadow-xl shadow-veda-brown/15">
                <Link to="/profile" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-cream">
                  <UserRound size={16} className="text-veda-muted" aria-hidden /> My Profile
                </Link>
                <Link to="/settings" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-cream">
                  <Settings size={16} className="text-veda-muted" aria-hidden /> Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-cream"
                >
                  <LogOut size={16} className="text-veda-muted" aria-hidden /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-in border-t border-line/70 px-3 pb-3 pt-2.5 sm:px-5 md:hidden">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-bark" aria-hidden />
            <input ref={mobileInputRef} type="search" placeholder="Search courses, students, orders…" aria-label="Search" className={`${field} pr-4 text-base`} />
          </div>
        </div>
      )}
    </header>
  );
}