import { CalendarPlus, Pencil, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import type { InstructorPatch } from '@/services/instructors.service';
import type { InstructorDetails, InstructorOptions, SlotDraft, SlotKind } from '@/types/instructor';
import { DAY_LONG, DAY_ORDER, DAY_SHORT, KIND_STYLE, findOverlap, formatRange, toMinutes, totalHours } from '@/utils/schedule';

interface Props {
  details: InstructorDetails;
  options: InstructorOptions;
  onSave: (patch: InstructorPatch) => Promise<void>;
}

type Row = SlotDraft & { key: string };

interface Form {
  days: number[];
  start: string;
  end: string;
  kind: SlotKind;
  title: string;
  courseSlug: string;
}

const EMPTY_FORM: Form = { days: [1], start: '18:00', end: '19:30', kind: 'live-class', title: '', courseSlug: '' };

let keyCounter = 0;
const nextKey = () => `slot-${Date.now()}-${(keyCounter += 1)}`;

const signature = (slots: SlotDraft[]) =>
  slots
    .map((s) => `${s.day}|${s.start}|${s.end}|${s.kind}|${s.title}|${s.courseSlug}`)
    .sort()
    .join(';');

const TRACK_START = 6 * 60; // the little week strip shows 6 AM - 11 PM
const TRACK_END = 23 * 60;

/** Read-only picture of the week: one row per day, a coloured block per session. */
function WeekStrip({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-3.5">
      <div className="space-y-1.5">
        {DAY_ORDER.map((day) => (
          <div key={day} className="flex items-center gap-2.5">
            <span className="w-8 shrink-0 text-[0.72rem] font-semibold text-veda-muted">{DAY_SHORT[day]}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-cream">
              {rows
                .filter((r) => r.day === day)
                .map((r) => {
                  const left = Math.max(0, ((toMinutes(r.start) - TRACK_START) / (TRACK_END - TRACK_START)) * 100);
                  const width = Math.min(100 - left, ((toMinutes(r.end) - Math.max(toMinutes(r.start), TRACK_START)) / (TRACK_END - TRACK_START)) * 100);
                  return <span key={r.key} title={`${formatRange(r.start, r.end)} · ${KIND_STYLE[r.kind].label}`} className="absolute inset-y-0.5 rounded" style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%`, background: KIND_STYLE[r.kind].bar }} />;
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between pl-[2.625rem] text-[0.66rem] text-veda-muted" aria-hidden>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );
}

/** Admin builds the instructor's weekly timetable: day(s), time, session type and (optionally) the course. */
export default function ScheduleTab({ details, options, onSave }: Props) {
  const [rows, setRows] = useState<Row[]>(() => details.schedule.map((s) => ({ ...s, key: s.id })));
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);

  const dirty = signature(rows) !== signature(details.schedule);

  const setField = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (day: number) =>
    setForm((f) => {
      if (editingKey) return { ...f, days: [day] }; // an existing session belongs to exactly one day
      return { ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day] };
    });

  const submitForm = () => {
    setFormError('');
    if (form.days.length === 0) return setFormError('Pick at least one day.');
    if (toMinutes(form.end) <= toMinutes(form.start)) return setFormError('End time must be after the start time.');

    const base = { start: form.start, end: form.end, kind: form.kind, title: form.title.trim(), courseSlug: form.courseSlug };
    const next: Row[] = editingKey
      ? rows.map((r) => (r.key === editingKey ? { ...r, ...base, day: form.days[0] } : r))
      : [...rows, ...form.days.map((day) => ({ ...base, day, key: nextKey() }))];

    if (next.length > 40) return setFormError('A schedule can have at most 40 weekly sessions.');
    const overlap = findOverlap(next);
    if (overlap) return setFormError(overlap);

    setRows(next);
    setEditingKey(null);
    setForm((f) => ({ ...EMPTY_FORM, days: editingKey ? [1] : f.days, start: f.start, end: f.end, kind: f.kind }));
  };

  const startEdit = (row: Row) => {
    setEditingKey(row.key);
    setFormError('');
    setForm({ days: [row.day], start: row.start, end: row.end, kind: row.kind, title: row.title, courseSlug: row.courseSlug });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setFormError('');
    setForm(EMPTY_FORM);
  };

  const remove = (key: string) => {
    setRows((cur) => cur.filter((r) => r.key !== key));
    if (editingKey === key) cancelEdit();
  };

  const save = async () => {
    setBusy(true);
    setSaveError('');
    try {
      await onSave({ schedule: rows.map((r) => ({ day: r.day, start: r.start, end: r.end, kind: r.kind, title: r.title, courseSlug: r.courseSlug })) });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const titleOf = (slug: string) => details.courses.find((c) => c.slug === slug)?.title ?? slug;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.84rem] text-veda-muted">
          Weekly timetable <span className="text-veda-text">(repeats every week · {details.timezone})</span>
        </p>
        <span className="rounded-full bg-peach px-3 py-1 text-[0.78rem] font-semibold text-veda-bark">
          {rows.length} {rows.length === 1 ? 'session' : 'sessions'} · {totalHours(rows)} h/week
        </span>
      </div>

      <WeekStrip rows={rows} />

      {/* add / edit a session */}
      <section className="rounded-2xl border border-gold/30 bg-peach/40 p-4">
        <h3 className="mb-3 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">{editingKey ? 'Edit session' : 'Add a session'}</h3>

        <div className="mb-3">
          <span className="mb-1.5 block text-[0.78rem] font-semibold text-veda-bark">{editingKey ? 'Day' : 'Day(s)'}</span>
          <div className="flex flex-wrap gap-1.5">
            {DAY_ORDER.map((day) => {
              const on = form.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  aria-label={DAY_LONG[day]}
                  onClick={() => toggleDay(day)}
                  className={`h-9 min-w-[2.75rem] rounded-lg border px-2.5 text-[0.8rem] font-semibold transition ${on ? 'border-saffron bg-saffron text-white' : 'border-line bg-white/80 text-veda-bark hover:border-gold/60'}`}
                >
                  {DAY_SHORT[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-semibold text-veda-bark">Starts</span>
            <input type="time" step={300} value={form.start} onChange={(e) => setField('start', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-semibold text-veda-bark">Ends</span>
            <input type="time" step={300} value={form.end} onChange={(e) => setField('end', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-semibold text-veda-bark">Session type</span>
            <select value={form.kind} onChange={(e) => setField('kind', e.target.value as SlotKind)} className={`${inputClass} cursor-pointer`}>
              {options.kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-semibold text-veda-bark">Course</span>
            <select value={form.courseSlug} onChange={(e) => setField('courseSlug', e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Not linked to a course</option>
              {details.courses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[0.78rem] font-semibold text-veda-bark">
              Title <span className="font-normal text-veda-muted">(optional)</span>
            </span>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={60} placeholder="e.g. Kundli reading practice" className={inputClass} />
          </label>
        </div>

        {details.courses.length === 0 && <p className="mt-2 text-[0.76rem] text-veda-muted">Assign courses in the Courses tab to link sessions to them.</p>}

        {formError && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.8rem] text-red-700">
            {formError}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap gap-2">
          <button type="button" onClick={submitForm} className={btnPrimary}>
            {editingKey ? <Save size={16} aria-hidden /> : <CalendarPlus size={16} aria-hidden />}
            {editingKey ? 'Update session' : form.days.length > 1 ? `Add to ${form.days.length} days` : 'Add session'}
          </button>
          {editingKey && (
            <button type="button" onClick={cancelEdit} className={btnSecondary}>
              <X size={15} aria-hidden /> Cancel
            </button>
          )}
        </div>
      </section>

      {/* sessions grouped by day */}
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[0.85rem] text-veda-muted">No sessions yet. Add the first one above.</p>
      ) : (
        <ul className="space-y-3">
          {DAY_ORDER.filter((day) => rows.some((r) => r.day === day)).map((day) => (
            <li key={day}>
              <p className="mb-1.5 text-[0.78rem] font-bold text-veda-bark">{DAY_LONG[day]}</p>
              <ul className="space-y-1.5">
                {rows
                  .filter((r) => r.day === day)
                  .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
                  .map((r) => (
                    <li key={r.key} className={`flex items-center gap-3 rounded-xl border bg-white/70 px-3 py-2.5 ${editingKey === r.key ? 'border-gold ring-2 ring-gold/30' : 'border-line'}`}>
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: KIND_STYLE[r.kind].bar }} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.86rem] font-semibold text-veda-bark">{formatRange(r.start, r.end)}</p>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.76rem] text-veda-muted">
                          <span className={`rounded px-1.5 py-0.5 text-[0.68rem] font-semibold ${KIND_STYLE[r.kind].chip}`}>{KIND_STYLE[r.kind].label}</span>
                          {r.title && <span className="truncate text-veda-text">{r.title}</span>}
                          {r.courseSlug && <span className="truncate">{titleOf(r.courseSlug)}</span>}
                        </p>
                      </div>
                      <button type="button" onClick={() => startEdit(r)} aria-label="Edit session" className="flex h-8 w-8 items-center justify-center rounded-lg text-veda-muted hover:bg-peach hover:text-veda-bark">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => remove(r.key)} aria-label="Remove session" className="flex h-8 w-8 items-center justify-center rounded-lg text-veda-muted hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {saveError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
          {saveError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy || !dirty} className={`${btnPrimary} w-full sm:w-auto`}>
          {busy ? <Spinner /> : <Save size={16} aria-hidden />}
          {busy ? 'Saving…' : 'Save schedule'}
        </button>
        {dirty && <span className="text-[0.78rem] text-[#C9701B]">You have unsaved changes</span>}
      </div>
    </div>
  );
}