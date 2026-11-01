import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import {
  DASH_SIDEBAR_ART_SRC,
  DASH_SIDEBAR_ITEMS,
  DASH_SIDEBAR_QUOTE_EN,
  DASH_SIDEBAR_QUOTE_SANSKRIT,
} from '@/constants/dashboard';

/** Warm sunrise-ghat gradient used when the sidebar picture is missing */
function SidebarArt() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="pointer-events-none relative min-h-[220px] flex-1" aria-hidden>
      {failed ? (
        <div className="absolute inset-0 bg-gradient-to-t from-[#e9a867]/70 via-[#f6cf93]/40 to-transparent" />
      ) : (
        <img
          src={DASH_SIDEBAR_ART_SRC}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-bottom [mask-image:linear-gradient(to_bottom,transparent,#000_30%)]"
        />
      )}
    </div>
  );
}

/** Left menu. `onNavigate` closes the phone drawer after a tap. */
export default function DashboardSidebar({ onNavigate, className = '' }: { onNavigate?: () => void; className?: string }) {
  return (
    <div className={`relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#fdf0da] via-[#fbe6c4] to-[#f4cf98] ${className}`}>
      <Mandala className="pointer-events-none absolute -left-24 top-[46%] h-60 w-60 text-gold/20 [stroke-width:0.4]" />

      <nav aria-label="Student menu" className="relative z-10 px-3.5 pt-5">
        <ul className="space-y-1">
          {DASH_SIDEBAR_ITEMS.map(({ key, label, to, Icon, end }) => (
            <li key={key}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-[0.95rem] transition-colors ${
                    isActive ? 'bg-veda-brown font-medium text-ivory shadow-soft' : 'text-veda-text hover:bg-gold-pale/60'
                  }`
                }
              >
                <Icon size={22} strokeWidth={1.4} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative z-10 mt-8 px-5 text-center">
        <p className="font-deva text-[1.35rem] font-semibold leading-snug text-veda-brown">“{DASH_SIDEBAR_QUOTE_SANSKRIT}”</p>
        <p className="mt-1 text-[0.82rem] leading-snug text-veda-text">{DASH_SIDEBAR_QUOTE_EN}</p>
      </div>

      <SidebarArt />
    </div>
  );
}