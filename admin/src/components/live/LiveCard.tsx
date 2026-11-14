import { CalendarClock, CircleStop, Copy, Download, Eye, Pencil, PlayCircle, Radio, Trash2, Users, Video, XCircle } from 'lucide-react';
import { Avatar, btnPrimary, btnSecondary } from '@/components/common/ui';
import RowMenu from '@/components/students/RowMenu';
import type { MenuItem } from '@/components/students/RowMenu';
import type { AdminLiveClass } from '@/types/live';
import { STATUS_STYLE, formatDuration, formatSeconds, formatWhen } from './liveUtils';

export interface LiveCardActions {
  onStart: (c: AdminLiveClass) => void;
  onEdit: (c: AdminLiveClass) => void;
  onCancel: (c: AdminLiveClass) => void;
  onDelete: (c: AdminLiveClass) => void;
  onCopy: (c: AdminLiveClass) => void;
  onAttendance: (c: AdminLiveClass) => void;
  onRemoveRecording: (c: AdminLiveClass) => void;
}

export default function LiveCard({ item: c, actions }: { item: AdminLiveClass; actions: LiveCardActions }) {
  const live = c.status === 'live';
  const upcoming = c.status === 'scheduled';
  const overdue = upcoming && new Date(c.endsAt).getTime() < Date.now();

  const menu: MenuItem[] = [
    ...(upcoming && !overdue ? [{ label: 'Edit details', icon: Pencil, onClick: () => actions.onEdit(c) }] : []),
    { label: 'Copy student link', icon: Copy, onClick: () => actions.onCopy(c) },
    ...(c.status === 'ended' || c.attendeeCount > 0 ? [{ label: 'Attendance report', icon: Eye, onClick: () => actions.onAttendance(c) }] : []),
    ...(c.recording ? [{ label: 'Delete recording', icon: Trash2, onClick: () => actions.onRemoveRecording(c), danger: true }] : []),
    ...(upcoming || live ? [{ label: 'Cancel class', icon: XCircle, onClick: () => actions.onCancel(c), danger: true }] : []),
    ...(!live ? [{ label: 'Delete', icon: Trash2, onClick: () => actions.onDelete(c), danger: true }] : []),
  ];

  const fill = c.maxStudents ? Math.min(100, Math.round(((live ? c.studentsNow : c.peakStudents) / c.maxStudents) * 100)) : 0;

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white/70 p-4 shadow-card transition hover:border-gold/50">
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.72rem] font-semibold ${live ? STATUS_STYLE.live : overdue ? STATUS_STYLE.ended : STATUS_STYLE[c.status]}`}>
          {live ? <Radio size={12} className="animate-pulse" aria-hidden /> : <CalendarClock size={12} aria-hidden />}
          {live ? 'Live now' : c.status === 'scheduled' ? (overdue ? 'Not held' : 'Scheduled') : c.status === 'ended' ? 'Completed' : 'Cancelled'}
        </span>
        <RowMenu items={menu} label={`Actions for ${c.title}`} />
      </div>

      <h3 className="mt-2.5 font-display text-[1.08rem] font-bold leading-snug text-veda-bark">{c.title}</h3>
      {c.courseTitle && <p className="mt-0.5 truncate text-[0.78rem] font-medium text-saffron">{c.courseTitle}</p>}

      <p className="mt-2.5 flex items-center gap-2 text-[0.84rem] text-veda-text">
        <CalendarClock size={15} className="shrink-0 text-saffron" aria-hidden /> {formatWhen(c.startsAt)} · {formatDuration(c.durationMin)}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-[0.84rem] text-veda-text">
        <Avatar name={c.host.name} className="h-5 w-5 text-[0.5rem]" /> <span className="truncate">{c.host.name}</span>
      </p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[0.76rem] text-veda-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} aria-hidden /> {live ? `${c.studentsNow} in class now` : c.status === 'ended' ? `Peak ${c.peakStudents} · ${c.attendeeCount} attended` : 'Capacity'}
          </span>
          <b className="text-veda-bark">max {c.maxStudents}</b>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gold/15" role="presentation">
          <div className={`h-full rounded-full ${fill > 85 ? 'bg-red-600' : 'bg-gradient-to-r from-gold to-saffron'}`} style={{ width: `${fill}%` }} />
        </div>
      </div>

      {c.cancelReason && c.status === 'cancelled' && <p className="mt-2.5 text-[0.78rem] text-veda-muted">Reason: {c.cancelReason}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {(live || (upcoming && !overdue)) && (
          <button type="button" onClick={() => actions.onStart(c)} className={`${btnPrimary} flex-1 !py-2`}>
            {live ? <PlayCircle size={16} aria-hidden /> : <Video size={16} aria-hidden />} {live ? 'Rejoin as host' : 'Start class'}
          </button>
        )}
        {c.recording && (
          <a href={c.recording.url} target="_blank" rel="noreferrer" download className={`${btnSecondary} flex-1 !py-2`}>
            <Download size={15} aria-hidden /> Recording · {formatSeconds(c.recording.durationSec)}
          </a>
        )}
        {c.status === 'ended' && !c.recording && (
          <button type="button" onClick={() => actions.onAttendance(c)} className={`${btnSecondary} flex-1 !py-2`}>
            <CircleStop size={15} aria-hidden /> Attendance
          </button>
        )}
        {(live || (upcoming && !overdue)) && (
          <button type="button" onClick={() => actions.onCopy(c)} className={`${btnSecondary} !px-3 !py-2`} aria-label="Copy student link" title="Copy student link">
            <Copy size={15} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}