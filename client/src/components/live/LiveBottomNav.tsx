import { BookOpen, Home, Radio, User, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const ITEMS = [
  { label: 'Home', to: '/', Icon: Home, end: true },
  { label: 'Live Classes', to: '/live-classes', Icon: Radio, end: false },
  { label: 'Courses', to: '/courses', Icon: BookOpen, end: false },
  { label: 'Community', to: '/community', Icon: UsersRound, end: false },
  { label: 'Profile', to: '/profile', Icon: User, end: false },
];

/**
 * Mobile-only tab bar from the design. It is `sticky` inside the page (not fixed), so it floats at the
 * bottom of the screen while the page is on screen and scrolls away before the footer.
 */
export default function LiveBottomNav() {
  return (
    <nav aria-label="Quick navigation" className="sticky bottom-0 z-40 border-t border-gold/25 bg-ivory/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 py-1.5">
        {ITEMS.map(({ label, to, Icon, end }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.68rem] transition-colors ${
                  isActive ? 'bg-gold-pale/70 font-medium text-veda-bark' : 'text-veda-text'
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
  );
}