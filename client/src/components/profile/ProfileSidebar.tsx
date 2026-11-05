import { NavLink } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { PROFILE_NAV } from '@/constants/profile';

/** Left menu card of the profile page (desktop). On phones the same sections live in the menu drawer. */
export default function ProfileSidebar() {
  return (
    <nav aria-label="Profile sections" className={`${CARD} hidden self-start p-3 lg:block`}>
      <ul className="space-y-1.5">
        {PROFILE_NAV.map(({ key, label, to, Icon, end }) => (
          <li key={key}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3.5 text-[0.98rem] transition-colors ${
                  isActive ? 'bg-veda-brown font-semibold text-ivory shadow-soft' : 'text-veda-bark hover:bg-gold-pale/60'
                }`
              }
            >
              <Icon size={22} strokeWidth={1.5} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}