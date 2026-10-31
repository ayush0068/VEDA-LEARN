import { CalendarDays, ChevronDown, Clock, Search, SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { COURSE_TABS } from '@/constants/courseCatalog';
import { LIVE_LEVEL_OPTIONS, LIVE_TEACHERS, LIVE_TIME_OPTIONS } from '@/constants/liveClasses';
import { formatShortDate } from '@/utils/liveClassFormat';

export interface LiveFilterState {
  query: string;
  category: string;
  teacher: string;
  level: string;
  date: string; // YYYY-MM-DD or ''
  time: string;
}

export const EMPTY_LIVE_FILTERS: LiveFilterState = { query: '', category: '', teacher: '', level: '', date: '', time: '' };

export const hasActiveLiveFilters = (f: LiveFilterState) => Object.values(f).some(Boolean);

interface Option {
  value: string;
  label: string;
}

const CATEGORY_OPTIONS: Option[] = COURSE_TABS.filter((t) => t.slug !== 'all').map((t) => ({ value: t.slug, label: t.label }));
const TEACHER_OPTIONS: Option[] = LIVE_TEACHERS.map((t) => ({ value: t.id, label: t.name }));
const LEVEL_OPTIONS: Option[] = LIVE_LEVEL_OPTIONS.map((l) => ({ value: l, label: l }));
const TIME_OPTIONS: Option[] = LIVE_TIME_OPTIONS.map((t) => ({ value: t.value, label: t.label }));

const box =
  'relative inline-flex h-11 items-center justify-between gap-2 rounded-lg border bg-ivory px-3 text-[0.82rem] text-veda-text transition-colors focus-within:border-gold lg:h-[42px] lg:px-3.5 lg:text-sm';
const boxState = (active: boolean) => (active ? 'border-saffron/70 bg-gold-pale/50 text-veda-bark' : 'border-gold/30 hover:border-gold/60');

/** Dropdown that looks like a button; a transparent native <select> on top keeps it accessible. */
function Select({ label, icon, value, options, onChange, className = '' }: { label: string; icon?: ReactNode; value: string; options: Option[]; onChange: (v: string) => void; className?: string }) {
  const current = options.find((o) => o.value === value);
  return (
    <label className={`${box} ${boxState(Boolean(value))} ${className}`}>
      <span className="flex min-w-0 items-center gap-2">
        {icon && <span className="shrink-0 text-veda-muted">{icon}</span>}
        <span className="truncate">{current ? current.label : label}</span>
      </span>
      <ChevronDown size={15} className="shrink-0 text-veda-muted" aria-hidden />
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Date button: opens the native date picker; shows the chosen day with a clear button. */
function DateField({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    try {
      ref.current?.showPicker();
    } catch {
      ref.current?.focus();
    }
  };
  return (
    <div className={`${box} ${boxState(Boolean(value))} ${className}`}>
      <button type="button" onClick={open} aria-label="Filter by date" className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <CalendarDays size={16} className="hidden shrink-0 text-veda-muted lg:block" aria-hidden />
        <span className="truncate">{value ? formatShortDate(value) : 'Date'}</span>
      </button>
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Clear date" className="text-veda-muted hover:text-veda-bark">
          <X size={15} aria-hidden />
        </button>
      ) : (
        <ChevronDown size={15} className="shrink-0 text-veda-muted" aria-hidden />
      )}
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-full opacity-0"
      />
    </div>
  );
}

function SearchBox({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`relative flex h-11 items-center gap-2.5 rounded-lg border border-gold/30 bg-ivory px-3.5 text-sm focus-within:border-gold lg:h-[42px] ${className}`}>
      <Search size={16} className="shrink-0 text-veda-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search live classes…"
        aria-label="Search live classes"
        className="min-w-0 flex-1 bg-transparent text-veda-bark outline-none placeholder:text-veda-muted/80 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="text-veda-muted hover:text-veda-bark">
          <X size={15} aria-hidden />
        </button>
      )}
    </label>
  );
}

interface LiveFiltersProps {
  filters: LiveFilterState;
  onChange: (patch: Partial<LiveFilterState>) => void;
  onClear: () => void;
}

export default function LiveFilters({ filters, onChange, onClear }: LiveFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const extraActive = Boolean(filters.level || filters.time);

  return (
    <div>
      {/* desktop: one row */}
      <div className="hidden items-center gap-3 lg:flex">
        <Select label="All Categories" value={filters.category} options={CATEGORY_OPTIONS} onChange={(category) => onChange({ category })} className="w-[170px]" />
        <Select label="All Teachers" value={filters.teacher} options={TEACHER_OPTIONS} onChange={(teacher) => onChange({ teacher })} className="w-[160px]" />
        <Select label="All Levels" value={filters.level} options={LEVEL_OPTIONS} onChange={(level) => onChange({ level })} className="w-[140px]" />
        <DateField value={filters.date} onChange={(date) => onChange({ date })} className="w-[120px]" />
        <Select label="Time" icon={<Clock size={16} aria-hidden />} value={filters.time} options={TIME_OPTIONS} onChange={(time) => onChange({ time })} className="w-[120px]" />
        <SearchBox value={filters.query} onChange={(query) => onChange({ query })} className="min-w-[180px] flex-1" />
      </div>

      {/* mobile */}
      <div className="space-y-3 lg:hidden">
        <SearchBox value={filters.query} onChange={(query) => onChange({ query })} />
        <div className="flex gap-1.5">
          <Select label="All Categories" value={filters.category} options={CATEGORY_OPTIONS} onChange={(category) => onChange({ category })} className="min-w-0 flex-[1.3] !gap-1 !px-2 !text-[0.76rem]" />
          <Select label="All Teachers" value={filters.teacher} options={TEACHER_OPTIONS} onChange={(teacher) => onChange({ teacher })} className="min-w-0 flex-[1.1] !gap-1 !px-2 !text-[0.76rem]" />
          <DateField value={filters.date} onChange={(date) => onChange({ date })} className="w-[68px] shrink-0 !gap-1 !px-2 !text-[0.76rem]" />
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-label="More filters"
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-ivory text-veda-brown ${extraActive || moreOpen ? 'border-saffron/70 bg-gold-pale/50' : 'border-gold/30'}`}
          >
            <SlidersHorizontal size={18} aria-hidden />
            {extraActive && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-saffron" />}
          </button>
        </div>
        {moreOpen && (
          <div className="animate-fade-in grid grid-cols-2 gap-2 rounded-xl border border-gold/25 bg-cream/60 p-3">
            <Select label="All Levels" value={filters.level} options={LEVEL_OPTIONS} onChange={(level) => onChange({ level })} />
            <Select label="Time" icon={<Clock size={16} aria-hidden />} value={filters.time} options={TIME_OPTIONS} onChange={(time) => onChange({ time })} />
            <button type="button" onClick={onClear} className="col-span-2 h-10 text-sm font-medium text-saffron">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}