import { Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Spinner, btnPrimary, inputClass } from '@/components/common/ui';
import type { InstructorPatch } from '@/services/instructors.service';
import type { InstructorDetails, InstructorOptions } from '@/types/instructor';

interface Props {
  details: InstructorDetails;
  options: InstructorOptions;
  onSave: (patch: InstructorPatch) => Promise<void>;
}

/** Admin picks which courses this instructor teaches. */
export default function CoursesTab({ details, options, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>(details.courses.map((c) => c.slug));
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const original = useMemo(() => details.courses.map((c) => c.slug).sort().join('|'), [details.courses]);
  const dirty = [...selected].sort().join('|') !== original;

  const visible = options.courses.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (slug: string) => setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await onSave({ courses: selected });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[0.84rem] text-veda-muted">
        Choose the courses <b className="text-veda-bark">{details.name}</b> can teach. Sessions in the schedule can only be linked to these courses.
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses…" aria-label="Search courses" className={`${inputClass} pl-10`} />
        </div>
        <span className="whitespace-nowrap rounded-full bg-peach px-3 py-1.5 text-[0.78rem] font-semibold text-veda-bark">{selected.length} selected</span>
      </div>

      {options.courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[0.85rem] text-veda-muted">There are no courses yet.</p>
      ) : (
        <ul className="max-h-[22rem] divide-y divide-line/70 overflow-y-auto rounded-2xl border border-line bg-white/70">
          {visible.map((c) => {
            const on = selected.includes(c.slug);
            return (
              <li key={c.slug}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-cream/60">
                  <input type="checkbox" checked={on} onChange={() => toggle(c.slug)} className="h-4 w-4 shrink-0 accent-[#7A3E14]" />
                  <span className="min-w-0 flex-1 truncate text-[0.88rem] font-medium text-veda-bark">{c.title}</span>
                  {!c.isActive && <span className="rounded bg-[#EFE6DA] px-1.5 py-0.5 text-[0.66rem] font-semibold text-veda-muted">Hidden</span>}
                </label>
              </li>
            );
          })}
          {visible.length === 0 && <li className="px-4 py-6 text-center text-[0.85rem] text-veda-muted">No course matches “{query}”.</li>}
        </ul>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
          {error}
        </p>
      )}

      <button type="button" onClick={save} disabled={busy || !dirty} className={`${btnPrimary} w-full sm:w-auto`}>
        {busy ? <Spinner /> : <Save size={16} aria-hidden />}
        {busy ? 'Saving…' : 'Save courses'}
      </button>
    </div>
  );
}