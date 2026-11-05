import { ArrowRight, BookOpen, Home, Info, LogIn, LogOut, Mail, PlayCircle, UserPlus, UserRound, LayoutDashboard, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { LotusMark } from '@/components/common/Logo';
import Avatar from '@/components/course/Avatar';
import { DASH_AVATAR_SRC } from '@/constants/dashboard';
import { NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';

const ICONS: Record<string, LucideIcon> = {
  '/': Home,
  '/courses': BookOpen,
  '/live-classes': PlayCircle,
  '/about': Info,
  '/contact': Mail,
};

const label = 'text-[0.66rem] font-medium uppercase tracking-[0.22em] text-veda-muted';
const outlineBtn =
  'flex items-center justify-center gap-2 rounded-md border border-gold/50 px-3 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-veda-brown transition-colors hover:border-saffron hover:bg-gold-pale/50 hover:text-saffron';

/**
 * Phone / tablet menu: slides in from the right over a blurred page.
 * Rendered in <body> (a portal) because the sticky navbar has a backdrop blur, which would trap a fixed panel.
 */
export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] transition-[visibility] duration-300 lg:hidden ${open ? 'visible' : 'invisible pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-veda-bark/55 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col overflow-y-auto border-l border-gold/30 bg-ivory shadow-2xl shadow-veda-bark/40 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* top: brand + close */}
        <div className="flex items-center justify-between gap-3 border-b border-gold/25 px-5 py-4">
          <Link to="/" onClick={onClose} className="flex min-w-0 items-center gap-2.5" aria-label="VedaLearn home">
            <LotusMark className="h-10 w-10 shrink-0" />
            <span className="min-w-0 leading-none">
              <span className="block font-display text-[1.45rem] font-semibold text-veda-brown">VedaLearn</span>
              <span className="mt-1 block text-[0.55rem] uppercase tracking-[0.16em] text-veda-muted">Ancient Wisdom. Online.</span>
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/40 text-veda-brown transition-colors hover:bg-gold-pale/60"
          >
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {/* navigation */}
        <nav aria-label="Mobile navigation" className="px-5 pt-6">
          <p className={label}>Navigation</p>
          <ul className="mt-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.to] ?? ArrowRight;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-4 rounded-md border px-4 py-3.5 text-[0.9rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                        isActive
                          ? 'border-gold/60 bg-gold-pale/50 text-veda-bark'
                          : 'border-transparent text-veda-muted hover:bg-gold-pale/30 hover:text-veda-bark'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} strokeWidth={1.5} className={isActive ? 'text-saffron' : ''} aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-saffron" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* start learning */}
        <div className="mt-6 border-t border-gold/25 px-5 pt-6">
          <p className={label}>Start learning</p>
          <Link
            to="/courses"
            onClick={onClose}
            className="mt-4 flex items-center justify-between rounded-md bg-veda-brown px-4 py-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ivory shadow-soft transition-colors hover:bg-veda-bark"
          >
            <span className="flex items-center gap-3">
              <BookOpen size={19} strokeWidth={1.6} aria-hidden /> Explore Courses
            </span>
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>

        {/* bottom: sign in / account */}
        <div className="mt-auto border-t border-gold/25 px-5 pb-6 pt-6">
          {user ? (
            <>
              <p className={label}>My account</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={user.name} src={user.avatar || DASH_AVATAR_SRC} className="h-11 w-11 ring-2 ring-gold/50" textClass="text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-[0.92rem] font-semibold text-veda-bark">{user.name}</p>
                  <p className="truncate text-[0.75rem] text-veda-muted">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/profile" onClick={onClose} className={outlineBtn}>
                  <UserRound size={16} aria-hidden /> Profile
                </Link>
                <Link to="/dashboard" onClick={onClose} className={outlineBtn}>
                  <LayoutDashboard size={16} aria-hidden /> Dashboard
                </Link>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className={`${outlineBtn} mt-3 w-full`}
              >
                <LogOut size={16} aria-hidden /> Log Out
              </button>
            </>
          ) : (
            <>
              <p className={label}>Join us</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/login" onClick={onClose} className={outlineBtn}>
                  <LogIn size={16} aria-hidden /> Log In
                </Link>
                <Link to="/register" onClick={onClose} className={`${outlineBtn} border-veda-brown bg-veda-brown !text-ivory hover:!bg-veda-bark`}>
                  <UserPlus size={16} aria-hidden /> Sign Up
                </Link>
              </div>
            </>
          )}
          <p className="mt-6 text-[0.62rem] uppercase tracking-[0.18em] text-veda-muted">© {new Date().getFullYear()} VedaLearn</p>
        </div>
      </aside>
    </div>,
    document.body,
  );
}