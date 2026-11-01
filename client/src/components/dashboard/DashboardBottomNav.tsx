import { NavLink } from 'react-router-dom';
import { DASH_BOTTOM_ITEMS } from '@/constants/dashboard';

/** Phone tab bar (fixed to the bottom of the screen) */
export default function DashboardBottomNav() {
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-0.5 px-1.5 py-1.5">
        {DASH_BOTTOM_ITEMS.map(({ key, label, to, Icon, end }) => (
          <li key={key}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 text-[0.66rem] leading-tight transition-colors ${
                  isActive ? 'bg-gold-pale/70 font-medium text-veda-bark' : 'text-veda-text'
                }`
              }
            >
              <Icon size={22} strokeWidth={1.5} aria-hidden />
              <span className="text-center">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}