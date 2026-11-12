import { Ban, BookOpen, CircleCheck, Clock, KeyRound, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/common/ui';
import RowMenu from '@/components/students/RowMenu';
import type { MenuItem } from '@/components/students/RowMenu';
import StatusPill from '@/components/students/StatusPill';
import type { Instructor } from '@/types/instructor';
import RoleBadge from './RoleBadge';

export interface InstructorActions {
  onManage: (i: Instructor) => void;
  onReset: (i: Instructor) => void;
  onToggle: (i: Instructor) => void;
  onDelete: (i: Instructor) => void;
}

export default function InstructorCard({ instructor: i, actions }: { instructor: Instructor; actions: InstructorActions }) {
  const items: MenuItem[] = [
    { label: 'Manage access & schedule', icon: SlidersHorizontal, onClick: () => actions.onManage(i) },
    { label: 'Reset password', icon: KeyRound, onClick: () => actions.onReset(i) },
    i.isActive ? { label: 'Disable account', icon: Ban, onClick: () => actions.onToggle(i) } : { label: 'Enable account', icon: CircleCheck, onClick: () => actions.onToggle(i) },
    { label: 'Delete', icon: Trash2, onClick: () => actions.onDelete(i), danger: true },
  ];

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-line bg-card/90 p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-gold/50">
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => actions.onManage(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar name={i.name} src={i.avatar} className="h-12 w-12 text-[0.9rem]" />
          <span className="min-w-0">
            <span className="block truncate font-display text-[1.05rem] font-bold leading-tight text-veda-bark">{i.name}</span>
            <span className="block truncate text-[0.78rem] text-veda-muted">{i.title || i.email}</span>
          </span>
        </button>
        <RowMenu label={i.name} items={items} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RoleBadge role={i.instructorRole} />
        <StatusPill student={i} />
      </div>

      {i.expertise.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {i.expertise.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-line bg-white/70 px-2.5 py-0.5 text-[0.72rem] text-veda-text">
              {tag}
            </span>
          ))}
          {i.expertise.length > 3 && <span className="rounded-full px-1.5 py-0.5 text-[0.72rem] text-veda-muted">+{i.expertise.length - 3}</span>}
        </div>
      ) : (
        <p className="mt-3 text-[0.76rem] text-veda-muted">{i.email}</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line/70 pt-3 text-center">
        <div>
          <dt className="flex items-center justify-center gap-1 text-[0.68rem] text-veda-muted">
            <BookOpen size={12} aria-hidden /> Courses
          </dt>
          <dd className="font-display text-[1.05rem] font-bold text-veda-bark">{i.courseCount}</dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[0.68rem] text-veda-muted">
            <Clock size={12} aria-hidden /> Hours/week
          </dt>
          <dd className="font-display text-[1.05rem] font-bold text-veda-bark">{i.hoursPerWeek}</dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[0.68rem] text-veda-muted">
            <ShieldCheck size={12} aria-hidden /> Access
          </dt>
          <dd className="font-display text-[1.05rem] font-bold text-veda-bark">{i.permissionCount}/6</dd>
        </div>
      </dl>
    </article>
  );
}