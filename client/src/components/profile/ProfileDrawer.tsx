import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import DashLogo from '@/components/dashboard/DashLogo';
import { PROFILE_NAV } from '@/constants/profile';

/** Phone / tablet menu of the profile page: only the profile sections, slides in from the left. */
export default function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] duration-300 lg:hidden ${open ? 'visible' : 'invisible pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Profile menu"
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-veda-bark/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col overflow-y-auto border-r border-gold/30 bg-ivory shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gold/25 px-4 py-3.5">
          <DashLogo compact />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/40 text-veda-brown hover:bg-gold-pale/60"
          >
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        <nav aria-label="Profile sections" className="px-4 pt-5">
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.22em] text-veda-muted">My Profile</p>
          <ul className="mt-3 space-y-1.5">
            {PROFILE_NAV.map(({ key, label, to, Icon, end }) => (
              <li key={key}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-xl px-4 py-3.5 text-[0.95rem] transition-colors ${
                      isActive ? 'bg-veda-brown font-semibold text-ivory shadow-soft' : 'text-veda-bark hover:bg-gold-pale/60'
                    }`
                  }
                >
                  <Icon size={21} strokeWidth={1.5} aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}