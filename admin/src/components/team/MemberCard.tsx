import { Crown } from 'lucide-react';
import { Avatar } from '@/components/common/ui';
import { formatMinutes } from '@/components/curriculum/curriculumUtils';
import RowMenu from '@/components/students/RowMenu';
import type { MenuItem } from '@/components/students/RowMenu';
import { LEVEL_STYLE, STATUS_STYLE, accessList } from '@/components/team/teamUtils';
import { timeAgo } from '@/utils/format';
import type { Member, TeamOptions } from '@/types/team';

interface Props {
  member: Member;
  options: TeamOptions | null;
  menu: MenuItem[];
  onOpen: () => void;
}

const LEVEL_SHORT = { none: '', view: 'View', edit: 'Edit', full: 'Full' } as const;

export default function MemberCard({ member: m, options, menu, onOpen }: Props) {
  const status = STATUS_STYLE[m.status];
  const access = m.isSuper ? [] : accessList(m.permissions, options?.modules);
  const seen = m.online ? 'Online now' : m.lastActiveAt ? `Active ${timeAgo(m.lastActiveAt)}` : m.lastLoginAt ? `Signed in ${timeAgo(m.lastLoginAt)}` : 'Never signed in';

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-card/90 shadow-card transition hover:border-gold/70">
      <div className="flex items-start gap-3 p-4">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-label={`Open ${m.name}`}>
          <span className="relative">
            <Avatar name={m.name} src={m.avatar} className="h-12 w-12 text-[0.9rem]" />
            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${m.online ? 'bg-ok' : 'bg-[#C8B9A6]'}`} title={m.online ? 'Online now' : 'Offline'} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-display text-[1.02rem] font-bold leading-tight text-veda-bark">{m.name}</span>
              {m.isSuper && <Crown size={15} className="shrink-0 text-gold" aria-label="Super admin" />}
            </span>
            <span className="block truncate text-[0.78rem] text-veda-muted">{m.email}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${m.isSuper ? 'bg-[#F6E3B4] text-[#8A5A00]' : 'bg-peach text-saffron'}`}>{m.title}</span>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${status.box}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
                {status.label}
              </span>
            </span>
          </span>
        </button>
        {menu.length > 0 && <RowMenu items={menu} label={m.name} />}
      </div>

      <div className="min-h-[3.4rem] px-4">
        {m.isSuper ? (
          <p className="text-[0.78rem] leading-snug text-veda-muted">Owner of the panel: full access to everything, and the only one who can manage admins.</p>
        ) : access.length === 0 ? (
          <p className="text-[0.78rem] text-[#B3402A]">No section assigned yet. This admin can only see the dashboard.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {access.slice(0, 4).map((a) => (
              <span key={a.key} className={`rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${LEVEL_STYLE[a.level]}`}>
                {a.label} · {LEVEL_SHORT[a.level]}
              </span>
            ))}
            {access.length > 4 && <span className="rounded-md bg-cream px-2 py-0.5 text-[0.7rem] font-semibold text-veda-muted">+{access.length - 4} more</span>}
          </div>
        )}
      </div>

      <button type="button" onClick={onOpen} tabIndex={-1} aria-hidden className="mt-3 grid grid-cols-3 gap-2 border-t border-line/70 px-4 py-2.5 text-left text-[0.74rem] text-veda-muted">
        <span>
          <strong className="block font-display text-[1.05rem] text-veda-bark">{m.actions7d}</strong>changes · 7 days
        </span>
        <span>
          <strong className="block font-display text-[1.05rem] text-veda-bark">{formatMinutes(m.activeMin7d)}</strong>active · 7 days
        </span>
        <span className="min-w-0">
          <strong className={`block truncate text-[0.82rem] ${m.online ? 'text-ok' : 'text-veda-bark'}`}>{seen}</strong>last seen
        </span>
      </button>
    </article>
  );
}