import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { LotusMark, MandalaMark, TempleSilhouette } from '@/components/common/Art';
import { useAuth } from '@/context/AuthContext';
import { DASHBOARD_ITEM, NAV_GROUPS } from '@/constants/navigation';
import type { NavItem } from '@/constants/navigation';

function SideLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const isDashboard = item.to === '/';

  return (
    <NavLink
      to={item.to}
      end={isDashboard}
      onClick={onNavigate}
      className={({ isActive }) =>
        isDashboard
          ? `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[0.95rem] font-semibold shadow-md transition ${
              isActive
                ? 'bg-gradient-to-r from-[#7A3E14] to-[#9A5521] text-ivory shadow-veda-brown/30'
                : 'text-veda-bark hover:bg-white/50'
            }`
          : `group flex items-center gap-2.5 rounded-lg px-2 py-[5px] text-[0.85rem] font-medium transition ${
              isActive ? 'bg-white/60 text-veda-bark shadow-sm' : 'text-veda-bark/90 hover:bg-white/45'
            }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={isDashboard ? 20 : 19} strokeWidth={1.7} className={isDashboard && isActive ? 'text-ivory' : 'text-[#8A5426]'} aria-hidden />
          <span className="flex-1 truncate">{item.label}</span>
          {!isDashboard && <ChevronRight size={15} className="text-veda-muted/70 transition group-hover:translate-x-0.5" aria-hidden />}
        </>
      )}
    </NavLink>
  );
}

/** Left navigation. Used as the fixed desktop column and inside the mobile drawer. */
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can, isSuper } = useAuth();
  // an admin only sees the sections they were given (the super admin sees everything)
  const allowed = (item: NavItem) => (item.superOnly ? isSuper : item.module ? can(item.module) : isSuper);
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter(allowed) })).filter((g) => g.items.length > 0);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#F8E4C9] via-[#FBEBD4] to-[#F5DAB8]">
      {/* faint art behind the menu */}
      <MandalaMark className="pointer-events-none absolute -left-24 top-56 h-72 w-72 text-gold/20" />
      <MandalaMark className="pointer-events-none absolute -right-28 top-[26rem] h-64 w-64 text-gold/15" />
      <TempleSilhouette className="pointer-events-none absolute -bottom-2 left-1/2 h-40 w-64 -translate-x-1/2 text-[#C98A4A]/35" />

      {/* brand arch */}
      <div className="relative shrink-0">
        <div className="relative overflow-hidden rounded-b-[50%_34px] bg-gradient-to-b from-[#B06A27] via-[#C58A45] to-[#EBC091] px-4 pb-5 pt-4 text-center shadow-lg shadow-veda-brown/20">
          <MandalaMark className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 text-white/10" />
          <LotusMark className="relative mx-auto h-11 w-11" />
          <p className="relative mt-1 font-display text-[1.7rem] font-semibold leading-none text-white">VedaLearn</p>
          <p className="relative mt-1.5 text-[0.82rem] text-white/90">Admin Panel</p>
          <div className="relative mt-2 flex items-center justify-center gap-2 text-[#F6E2B6]" aria-hidden>
            <span className="text-xs">⟶</span>
            <span className="font-deva text-lg leading-none">ॐ</span>
            <span className="text-xs">⟵</span>
          </div>
        </div>
      </div>

      {/* menu */}
      <nav aria-label="Admin navigation" className="thin-scroll relative flex-1 overflow-y-auto px-3.5 pb-20 pt-3.5">
        <SideLink item={DASHBOARD_ITEM} onNavigate={onNavigate} />

        {groups.map((group) => (
          <div key={group.title} className="mt-3">
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[#8F4F1E]">
              {group.title}
              <span className="h-1 w-1 rounded-full bg-gold" aria-hidden />
              <span className="h-px flex-1 bg-gold/40" aria-hidden />
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => (
                <li key={item.to}>
                  <SideLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}