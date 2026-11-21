import { Clock, Eye, EyeOff, ExternalLink, FileText, Layers, Pencil, Star, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { env } from '@/config/env';
import RowMenu from '@/components/students/RowMenu';
import type { MenuItem } from '@/components/students/RowMenu';
import type { AdminCourse } from '@/types/course';
import { rupees } from '@/utils/format';
import CourseImage from './CourseImage';

export interface CourseActions {
  onEdit: (c: AdminCourse) => void;
  onToggle: (c: AdminCourse) => void;
  onDelete: (c: AdminCourse) => void;
}

export default function CourseCard({ course: c, categoryLabel, actions }: { course: AdminCourse; categoryLabel: string; actions: CourseActions }) {
  const navigate = useNavigate();
  const off = c.originalPrice && c.originalPrice > c.price ? Math.round((1 - c.price / c.originalPrice) * 100) : 0;

  const items: MenuItem[] = [
    { label: 'Edit course', icon: Pencil, onClick: () => actions.onEdit(c) },
    { label: 'Manage curriculum', icon: Layers, onClick: () => navigate(`/modules-lessons/${encodeURIComponent(c.slug)}`) },
    { label: 'View on website', icon: ExternalLink, onClick: () => window.open(`${env.siteUrl}/courses/${c.slug}`, '_blank', 'noopener') },
    c.isActive ? { label: 'Hide from website', icon: EyeOff, onClick: () => actions.onToggle(c) } : { label: 'Show on website', icon: Eye, onClick: () => actions.onToggle(c) },
    { label: 'Delete', icon: Trash2, onClick: () => actions.onDelete(c), danger: true },
  ];

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-card/90 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-gold/50 ${c.isActive ? '' : 'opacity-80'}`}>
      <button type="button" onClick={() => actions.onEdit(c)} aria-label={`Edit ${c.title}`} className="relative block aspect-[16/9] w-full overflow-hidden bg-cream">
        <CourseImage
          value={c.image}
          className="h-full w-full object-cover"
          fallback={<span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-veda-bark to-saffron text-[0.78rem] font-medium text-ivory/80">No image</span>}
        />
        <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {c.badge && <span className="rounded-md bg-[#F4C04E] px-2.5 py-1 text-[0.7rem] font-semibold text-veda-bark shadow-sm">{c.badge}</span>}
          {!c.isActive && <span className="rounded-md bg-veda-bark/80 px-2.5 py-1 text-[0.7rem] font-semibold text-ivory">Hidden</span>}
        </span>
        {c.isPopular && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-ivory/95 px-2 py-1 text-[0.7rem] font-semibold text-saffron shadow-sm">
            <Star size={12} className="fill-gold text-gold" aria-hidden /> Homepage
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-display text-[1.05rem] font-bold leading-snug text-veda-bark">{c.title}</h3>
            <p className="mt-0.5 truncate text-[0.76rem] text-veda-muted">{categoryLabel}</p>
          </div>
          <RowMenu label={c.title} items={items} />
        </div>

        <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-[1.3rem] font-bold text-veda-bark">{c.isFree || c.price === 0 ? 'Free' : rupees(c.price)}</span>
          {off > 0 && c.originalPrice && <span className="text-[0.8rem] text-veda-muted line-through">{rupees(c.originalPrice)}</span>}
          {off > 0 && <span className="rounded-md bg-gold-pale px-2 py-0.5 text-[0.7rem] font-semibold text-saffron">{off}% OFF</span>}
        </p>

        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-line/70 pt-3 text-[0.76rem] text-veda-text">
          {c.weeks != null && (
            <li className="flex items-center gap-1.5">
              <Clock size={13} className="text-veda-muted" aria-hidden /> {c.weeks} weeks
            </li>
          )}
          {c.lessons != null && (
            <li className="flex items-center gap-1.5">
              <FileText size={13} className="text-veda-muted" aria-hidden /> {c.lessons} lessons
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <Star size={13} className="fill-gold text-gold" aria-hidden /> {c.rating.toFixed(1)} · {new Intl.NumberFormat('en-IN').format(c.studentsCount)}
          </li>
          {c.instructor && (
            <li className="flex min-w-0 items-center gap-1.5">
              <User size={13} className="shrink-0 text-veda-muted" aria-hidden /> <span className="truncate">{c.instructor}</span>
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}