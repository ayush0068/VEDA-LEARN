import { Ban, CircleCheck, Eye, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/common/ui';
import type { Student } from '@/types';
import { formatDate, timeAgo } from '@/utils/format';
import RowMenu from './RowMenu';
import type { MenuItem } from './RowMenu';
import StatusPill from './StatusPill';

export interface StudentActions {
  onView: (s: Student) => void;
  onEdit: (s: Student) => void;
  onReset: (s: Student) => void;
  onToggle: (s: Student) => void;
  onDelete: (s: Student) => void;
}

const menuFor = (s: Student, a: StudentActions): MenuItem[] => [
  { label: 'View details', icon: Eye, onClick: () => a.onView(s) },
  { label: 'Edit student', icon: Pencil, onClick: () => a.onEdit(s) },
  { label: 'Reset password', icon: KeyRound, onClick: () => a.onReset(s) },
  s.isActive
    ? { label: 'Disable account', icon: Ban, onClick: () => a.onToggle(s) }
    : { label: 'Enable account', icon: CircleCheck, onClick: () => a.onToggle(s) },
  { label: 'Delete', icon: Trash2, onClick: () => a.onDelete(s), danger: true },
];

export default function StudentsTable({ students, actions }: { students: Student[]; actions: StudentActions }) {
  return (
    <>
      {/* table (large screens) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-separate border-spacing-0 text-left text-[0.82rem]">
          <thead>
            <tr className="bg-[#FBEBD6] text-veda-bark">
              {['Student', 'Student ID', 'Phone', 'Courses', 'Joined', 'Last login', 'Status', ''].map((h, i, all) => (
                <th key={h || 'actions'} className={`whitespace-nowrap px-3 py-2.5 text-[0.74rem] font-bold ${i === 0 ? 'rounded-l-lg' : ''} ${i === all.length - 1 ? 'w-12 rounded-r-lg' : ''} ${h === 'Last login' ? 'hidden xl:table-cell' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="group text-veda-bark transition hover:bg-white/50">
                <td className="border-b border-line/60 px-3 py-3">
                  <button type="button" onClick={() => actions.onView(s)} className="flex max-w-[260px] items-center gap-3 text-left">
                    <Avatar name={s.name} src={s.avatar} className="h-9 w-9 text-[0.72rem]" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold group-hover:text-saffron">{s.name}</span>
                      <span className="block truncate text-[0.76rem] text-veda-muted">{s.email}</span>
                    </span>
                  </button>
                </td>
                <td className="whitespace-nowrap border-b border-line/60 px-3 py-3 font-medium">{s.studentId || '—'}</td>
                <td className="whitespace-nowrap border-b border-line/60 px-3 py-3">{s.phone || '—'}</td>
                <td className="border-b border-line/60 px-3 py-3 font-medium">{s.courses}</td>
                <td className="whitespace-nowrap border-b border-line/60 px-3 py-3">{formatDate(s.createdAt)}</td>
                <td className="hidden whitespace-nowrap border-b border-line/60 px-3 py-3 text-veda-muted xl:table-cell">{timeAgo(s.lastLoginAt)}</td>
                <td className="border-b border-line/60 px-3 py-3">
                  <StatusPill student={s} />
                </td>
                <td className="border-b border-line/60 px-2 py-3 text-right">
                  <RowMenu label={s.name} items={menuFor(s, actions)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* cards (phones + tablets) */}
      <ul className="divide-y divide-line/70 lg:hidden">
        {students.map((s) => (
          <li key={s.id} className="py-3.5">
            <div className="flex items-start gap-3">
              <button type="button" onClick={() => actions.onView(s)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Avatar name={s.name} src={s.avatar} className="h-11 w-11 text-[0.8rem]" />
                <span className="min-w-0">
                  <span className="block truncate text-[0.95rem] font-semibold text-veda-bark">{s.name}</span>
                  <span className="block truncate text-[0.78rem] text-veda-muted">{s.email}</span>
                </span>
              </button>
              <RowMenu label={s.name} items={menuFor(s, actions)} />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-14 text-[0.76rem] text-veda-muted">
              <StatusPill student={s} />
              {s.studentId && <span>{s.studentId}</span>}
              {s.phone && <span>{s.phone}</span>}
              <span>{s.courses} {s.courses === 1 ? 'course' : 'courses'}</span>
              <span>Joined {formatDate(s.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}