import { NavLink } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { PROFILE_NAV } from '@/constants/profile';

/** Left menu card (desktop) / swipeable pill row (phone) of the profile page */
export default function ProfileSidebar() {
  return (
    <>
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

      <nav aria-label="Profile sections" className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">
        <ul className="flex w-max gap-2">
          {PROFILE_NAV.map(({ key, label, to, Icon, end }) => (
            <li key={key}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
                    isActive ? 'border-veda-brown bg-veda-brown font-medium text-ivory' : 'border-gold/35 bg-ivory/80 text-veda-bark'
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.6} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}