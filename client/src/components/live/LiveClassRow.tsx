import { ArrowRight, CalendarDays, Check, Clock, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLiveTeacher } from '@/constants/liveClasses';
import type { LiveClass } from '@/constants/liveClasses';
import { formatClassDate, formatTimeRange } from '@/utils/liveClassFormat';
import { DateBadge, liveActionLabel } from './LiveClassCard';
import { LiveThumb } from './LiveCommon';

interface LiveClassRowProps {
  item: LiveClass;
  index: number;
  enrolled: boolean;
  onJoin: (c: LiveClass) => void;
}

/** Mobile / tablet list item: thumbnail with date badge on the left, details on the right. */
export default function LiveClassRow({ item, index, enrolled, onJoin }: LiveClassRowProps) {
  const teacher = getLiveTeacher(item.teacherId);
  const href = `/live-classes/${item.id}`;
  const action = liveActionLabel(item, enrolled, true);
  const pill = item.status === 'ongoing' ? 'LIVE NOW' : item.status === 'completed' ? 'Recording' : 'Live Class';

  return (
    <article className="flex gap-3 rounded-2xl border border-gold/20 bg-ivory/90 p-2.5 shadow-soft">
      <Link to={href} className="relative block w-[36%] max-w-[190px] shrink-0 overflow-hidden rounded-xl" aria-label={item.title}>
        <LiveThumb src={item.image} category={item.category} seed={index} className="h-full min-h-[150px] w-full" />
        <DateBadge date={item.date} className="absolute left-1.5 top-1.5 !px-1.5 !py-1" />
        <span
          className={`absolute right-1.5 top-1.5 rounded-md px-2 py-0.5 text-[0.62rem] font-semibold text-white ${
            item.status === 'ongoing' ? 'bg-red-600' : 'bg-veda-bark/60 backdrop-blur-sm'
          }`}
        >
          {pill}
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="font-display text-[1.02rem] font-semibold leading-snug text-veda-bark">
          <Link to={href}>{item.title}</Link>
        </h3>
        <p className="mt-0.5 truncate text-[0.82rem] text-veda-text">{teacher.name}</p>

        <ul className="mt-2 space-y-1 text-[0.78rem] text-veda-text">
          <li className="flex items-center gap-2">
            <CalendarDays size={14} className="shrink-0 text-veda-muted" aria-hidden />
            {formatClassDate(item.date)}
          </li>
          <li className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-veda-muted" aria-hidden />
            {formatTimeRange(item)}
          </li>
          <li className="flex items-center gap-2">
            <Video size={14} className="shrink-0 text-veda-muted" aria-hidden />
            Live on {item.platform}
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="rounded-md bg-gold-pale px-2.5 py-1 text-[0.72rem] font-medium text-saffron">{item.level}</span>
          <button
            type="button"
            onClick={() => onJoin(item)}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[0.8rem] font-medium transition-colors ${
              action.done ? 'border border-veda-brown/60 bg-gold-pale/50 text-veda-brown' : 'bg-veda-brown text-ivory hover:bg-veda-bark'
            }`}
          >
            {action.done && <Check size={14} aria-hidden />}
            {action.text}
            {!action.done && <ArrowRight size={14} aria-hidden />}
          </button>
        </div>
      </div>
    </article>
  );
}