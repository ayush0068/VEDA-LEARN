import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  DURATION_OPTIONS,
  LANGUAGE_OPTIONS,
  LEVEL_OPTIONS,
  PRICE_OPTIONS,
  SORT_OPTIONS,
} from '../../constants/courseCatalog';
import type { Option } from '../../constants/courseCatalog';

export interface Filters {
  query: string;
  level: string;
  duration: string;
  price: string;
  language: string;
  sort: string;
}

export const EMPTY_FILTERS: Filters = { query: '', level: '', duration: '', price: '', language: '', sort: 'popular' };

interface FilterSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

/** Dropdown that looks like a button ("Level ⌄"); a transparent native <select> on top keeps it accessible. */
function FilterSelect({ label, value, options, onChange, className = '' }: FilterSelectProps) {
  const current = options.find((o) => o.value === value);
  return (
    <label
      className={`relative inline-flex h-11 items-center justify-between gap-1.5 rounded-lg border bg-ivory px-2.5 text-[0.82rem] text-veda-text transition-colors focus-within:border-gold lg:h-10 lg:gap-2 lg:px-3.5 lg:text-sm ${
        value ? 'border-saffron/70 bg-gold-pale/50 text-veda-bark' : 'border-gold/30 hover:border-gold/60'
      } ${className}`}
    >
      <span className="truncate">{current ? current.label : label}</span>
      <ChevronDown size={15} className="shrink-0 text-veda-muted" aria-hidden />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        <option value="">{`Any ${label.toLowerCase()}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** "Sort by: Popular ⌄" */
export function SortSelect({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];
  return (
    <label className={`relative inline-flex items-center gap-1.5 text-sm text-veda-text ${className}`}>
      <span>Sort by:</span>
      <span className="font-medium text-veda-bark">{current.label}</span>
      <ChevronDown size={15} className="text-veda-muted" aria-hidden />
      <select
        aria-label="Sort courses"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterBarProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
        {/* search */}
        <label className="flex h-12 items-center gap-2.5 rounded-xl border border-gold/30 bg-ivory px-4 focus-within:border-gold lg:h-10 lg:max-w-[390px] lg:flex-1 lg:rounded-lg">
          <Search size={18} className="shrink-0 text-veda-muted" aria-hidden />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Search courses by name, topic or teacher..."
            aria-label="Search courses"
            className="w-full min-w-0 bg-transparent text-sm text-veda-bark placeholder:text-veda-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
        </label>

        {/* filters */}
        <div className="flex items-center gap-2 lg:gap-3">
          <FilterSelect label="Level" value={filters.level} options={LEVEL_OPTIONS} onChange={(level) => onChange({ level })} className="min-w-0 flex-1 lg:flex-none" />
          <FilterSelect label="Duration" value={filters.duration} options={DURATION_OPTIONS} onChange={(duration) => onChange({ duration })} className="min-w-0 flex-1 lg:flex-none" />
          <FilterSelect label="Price" value={filters.price} options={PRICE_OPTIONS} onChange={(price) => onChange({ price })} className="min-w-0 flex-1 lg:flex-none" />
          <div className="hidden lg:block">
            <FilterSelect label="Language" value={filters.language} options={LANGUAGE_OPTIONS} onChange={(language) => onChange({ language })} />
          </div>

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="More filters"
            className={`flex h-11 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors lg:hidden ${
              moreOpen || filters.language ? 'border-saffron/70 bg-gold-pale/60 text-veda-brown' : 'border-gold/40 bg-ivory text-veda-brown'
            }`}
          >
            <SlidersHorizontal size={19} aria-hidden />
          </button>
        </div>

        {/* desktop sort */}
        <div className="hidden lg:ml-auto lg:block">
          <SortSelect value={filters.sort} onChange={(sort) => onChange({ sort })} />
        </div>
      </div>

      {/* mobile: extra filters */}
      {moreOpen && (
        <div className="mt-3 grid animate-fade-in grid-cols-2 gap-2 lg:hidden">
          <FilterSelect label="Language" value={filters.language} options={LANGUAGE_OPTIONS} onChange={(language) => onChange({ language })} />
          <label className="relative inline-flex h-11 items-center justify-between gap-2 rounded-lg border border-gold/30 bg-ivory px-3.5 text-sm text-veda-text">
            <span className="truncate">{SORT_OPTIONS.find((o) => o.value === filters.sort)?.label}</span>
            <ChevronDown size={15} className="text-veda-muted" aria-hidden />
            <select
              aria-label="Sort courses"
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}