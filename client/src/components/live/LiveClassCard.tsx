import { ArrowRight, Bookmark, CalendarDays, Check, Clock, UsersRound, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLiveTeacher } from '@/constants/liveClasses';
import type { LiveClass } from '@/constants/liveClasses';
import { dayPadded, formatClassDate, formatRegistered, formatTimeRange, monthShort, weekdayShort } from '@/utils/liveClassFormat';
import { LiveThumb, TeacherAvatar } from './LiveCommon';

/** Label of the main button for a class, shared by the card, the mobile row and the detail page. */
export const liveActionLabel = (c: LiveClass, enrolled: boolean, short = false): { text: string; done: boolean } => {
  if (c.status === 'completed') return { text: 'Watch Recording', done: false };
  if (c.status === 'ongoing') return { text: 'Join Now', done: false };
  if (enrolled) return { text: 'Registered', done: true };
  return { text: short ? 'Join Live' : 'Join Live Class', done: false };
};

export const registeredCount = (c: LiveClass, enrolled: boolean) => c.registered + (enrolled ? 1 : 0);

export function DateBadge({ date, className = '' }: { date: string; className?: string }) {
  return (
    <span className={`flex flex-col items-center rounded-lg bg-ivory px-2 py-1 text-center leading-none text-veda-bark shadow-md ${className}`}>
      <span className="text-[0.62rem] font-medium tracking-wide">{monthShort(date)}</span>
      <span className="font-display text-[1.45rem] font-bold leading-[1.1]">{dayPadded(date)}</span>
      <span className="text-[0.62rem] text-veda-muted">{weekdayShort(date)}</span>
    </span>
  );
}

interface LiveClassCardProps {
  item: LiveClass;
  index: number;
  saved: boolean;
  enrolled: boolean;
  onToggleSaved: (c: LiveClass) => void;
  onJoin: (c: LiveClass) => void;
}

/** Desktop card (3 per row). */
export default function LiveClassCard({ item, index, saved, enrolled, onToggleSaved, onJoin }: LiveClassCardProps) {
  const teacher = getLiveTeacher(item.teacherId);
  const href = `/live-classes/${item.id}`;
  const action = liveActionLabel(item, enrolled);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gold/25 bg-ivory shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold/55">
      <div className="relative aspect-[16/8.4] overflow-hidden">
        <Link to={href} className="block h-full w-full" aria-label={item.title} tabIndex={-1}>
          <LiveThumb src={item.image} category={item.category} seed={index} className="h-full w-full transition duration-500 group-hover:scale-105" />
        </Link>
        <DateBadge date={item.date} className="absolute left-2.5 top-2.5" />
        {item.status === 'ongoing' && (
          <span className="absolute left-[4.2rem] top-2.5 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[0.68rem] font-semibold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
          </span>
        )}
        <span className="absolute right-12 top-2.5 rounded-lg bg-ivory/95 px-3 py-1 text-[0.7rem] font-medium text-veda-bark shadow-sm">{item.level}</span>
        <button
          type="button"
          onClick={() => onToggleSaved(item)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-veda-bark/70 text-ivory backdrop-blur-sm transition-colors hover:bg-veda-bark"
        >
          <Bookmark size={16} className={saved ? 'fill-gold-soft text-gold-soft' : ''} aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <h3 className="font-display text-[1.08rem] font-semibold leading-snug text-veda-bark">
          <Link to={href} className="hover:text-saffron">
            {item.title}
          </Link>
        </h3>

        <p className="mt-2 flex items-center gap-2 text-[0.8rem] text-veda-text">
          <TeacherAvatar src={teacher.avatar} name={teacher.name} className="h-6 w-6" />
          <span className="truncate">{teacher.name}</span>
        </p>

        <ul className="mb-4 mt-3 grid grid-cols-[1.1fr_1fr] gap-x-2 gap-y-1.5 text-[0.72rem] text-veda-text">
          <li className="flex items-center gap-1.5">
            <CalendarDays size={14} className="shrink-0 text-veda-muted" aria-hidden />
            <span className="whitespace-nowrap">{formatClassDate(item.date)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Clock size={14} className="shrink-0 text-veda-muted" aria-hidden />
            <span className="whitespace-nowrap">{formatTimeRange(item, true)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Video size={14} className="shrink-0 text-veda-muted" aria-hidden />
            Live on {item.platform}
          </li>
          <li className="flex items-center gap-1.5">
            <UsersRound size={14} className="shrink-0 text-veda-muted" aria-hidden />
            {formatRegistered(registeredCount(item, enrolled))} Registered
          </li>
        </ul>

        <button
          type="button"
          onClick={() => onJoin(item)}
          className={`mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[0.82rem] font-medium transition-colors ${
            action.done ? 'border border-veda-brown/60 bg-gold-pale/50 text-veda-brown hover:bg-gold-pale' : 'bg-veda-brown text-ivory hover:bg-veda-bark'
          }`}
        >
          {action.done ? <Check size={15} aria-hidden /> : null}
          {action.text}
          {!action.done && <ArrowRight size={15} aria-hidden />}
        </button>
      </div>
    </article>
  );
}