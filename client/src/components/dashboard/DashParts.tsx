import { ArrowRight, Bookmark } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LiveThumb, TeacherAvatar } from '@/components/live/LiveCommon';
import type { EnrollmentStatus } from '@/types/dashboard';
import { teacherAvatarSrc } from '@/utils/dashboardLogic';

/** Card surface used across the dashboard */
export const CARD = 'rounded-2xl border border-gold/20 bg-[#fffaf1]/90 shadow-[0_10px_30px_-18px_rgba(90,45,15,0.35)]';

export function SectionTitle({
  title,
  to,
  onClick,
  label = 'View All',
  id,
  size = 'lg',
}: {
  title: string;
  to?: string;
  onClick?: () => void;
  label?: string;
  id?: string;
  size?: 'lg' | 'md';
}) {
  const link = 'inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-veda-brown transition-colors hover:text-saffron';
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className={`font-display font-bold text-veda-bark ${size === 'lg' ? 'text-[1.45rem]' : 'text-[1.2rem]'}`}>
        {title}
      </h2>
      {to ? (
        <Link to={to} className={link}>
          {label} <ArrowRight size={15} aria-hidden />
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={link}>
          {label} <ArrowRight size={15} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-[7px] overflow-hidden rounded-full bg-gold-pale/70 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-gold to-saffron transition-[width] duration-700" style={{ width: `${percent}%` }} />
    </div>
  );
}

const PILL: Record<EnrollmentStatus, { label: string; cls: string }> = {
  'in-progress': { label: 'In Progress', cls: 'bg-[#f6dfa6] text-veda-bark' },
  'not-started': { label: 'Not Started', cls: 'bg-white/95 text-veda-bark' },
  completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-900' },
};

export function StatusPill({ status, className = '' }: { status: EnrollmentStatus; className?: string }) {
  const p = PILL[status];
  return <span className={`rounded-full px-3 py-1 text-[0.72rem] font-medium shadow-sm ${p.cls} ${className}`}>{p.label}</span>;
}

/** Square bookmark button that sits on top of a photo (or plain, on the mobile list) */
export function BookmarkButton({
  saved,
  onToggle,
  label,
  variant = 'overlay',
}: {
  saved: boolean;
  onToggle: () => void;
  label: string;
  variant?: 'overlay' | 'plain';
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove bookmark: ${label}` : `Bookmark: ${label}`}
      className={
        variant === 'overlay'
          ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-veda-bark shadow-sm transition-colors hover:bg-white'
          : 'flex h-8 w-8 items-center justify-center rounded-lg text-veda-bark transition-colors hover:bg-gold-pale/60'
      }
    >
      <Bookmark size={18} strokeWidth={1.6} className={saved ? 'fill-saffron text-saffron' : ''} aria-hidden />
    </button>
  );
}

export function IconCircle({ children, className = 'h-16 w-16' }: { children: ReactNode; className?: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-gold-pale/70 text-saffron ${className}`}>{children}</span>;
}

/** Skeleton shown while the dashboard loads */
export function DashboardSkeleton() {
  const block = 'animate-pulse rounded-2xl bg-gold-pale/50';
  return (
    <div className="space-y-5 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Loading your dashboard">
      <div className={`${block} h-28`} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-24`} />
        ))}
      </div>
      <div className={`${block} h-44`} />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${block} h-64`} />
        ))}
      </div>
    </div>
  );
}

/** Course / class picture from client/public/images (gradient + icon when the file is missing) */
export function CourseImage({ src, category, seed = 0, className = '' }: { src: string; category: string; seed?: number; className?: string }) {
  return <LiveThumb src={src || '/images/courses/_missing.png'} category={category} seed={seed} className={className} />;
}

/** Teacher photo + name on one line */
export function Teacher({ name, size = 'sm', className = '' }: { name: string; size?: 'sm' | 'md'; className?: string }) {
  if (!name) return null;
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      <TeacherAvatar src={teacherAvatarSrc(name)} name={name} className={size === 'md' ? 'h-7 w-7' : 'h-6 w-6'} />
      <span className={`truncate text-veda-text ${size === 'md' ? 'text-[0.9rem]' : 'text-[0.82rem]'}`}>{name}</span>
    </span>
  );
}