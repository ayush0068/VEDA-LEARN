import { CalendarClock, Info, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Field from '@/components/courses/Field';
import Modal from '@/components/common/Modal';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import { createLiveClass, updateLiveClass } from '@/services/live.service';
import type { AdminLiveClass, LiveAccess, LiveFeatureFlags, LiveOptions, LiveResource } from '@/types/live';
import { FEATURES, capacityAdvice, defaultStart, toLocalInput } from './liveUtils';

const DURATIONS = [30, 45, 60, 90, 120, 180];
const DEFAULT_FEATURES: LiveFeatureFlags = { chat: true, handRaise: true, polls: true, reactions: true, studentCamera: false, recording: true };

interface Props {
  /** null = closed, 'new' = schedule, otherwise the class being edited */
  target: 'new' | AdminLiveClass | null;
  options: LiveOptions | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

interface Draft {
  title: string;
  description: string;
  courseSlug: string;
  host: string;
  startsAt: string;
  durationMin: number;
  maxStudents: number;
  access: LiveAccess;
  features: LiveFeatureFlags;
  resources: LiveResource[];
}

export default function LiveFormDrawer({ target, options, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    setError('');
    if (target === 'new') {
      setDraft({
        title: '',
        description: '',
        courseSlug: '',
        host: options?.hosts[0]?.id ?? '',
        startsAt: defaultStart(),
        durationMin: 60,
        maxStudents: options?.limits.defaultMaxStudents ?? 30,
        access: 'enrolled',
        features: { ...DEFAULT_FEATURES },
        resources: [],
      });
    } else {
      setDraft({
        title: target.title,
        description: target.description,
        courseSlug: target.courseSlug,
        host: target.host.id,
        startsAt: toLocalInput(target.startsAt),
        durationMin: target.durationMin,
        maxStudents: target.maxStudents,
        access: target.access,
        features: { ...target.features },
        resources: target.resources.map((r) => ({ ...r })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (!target || !draft) return null;
  const limit = options?.limits.maxStudentsLimit ?? 100;
  const advice = capacityAdvice(draft.maxStudents);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (draft.title.trim().length < 3) return setError('Please enter the class title');
    if (!draft.host) return setError('Please choose who will take the class');
    if (!draft.startsAt) return setError('Please choose the date and time');
    if (!Number.isInteger(draft.maxStudents) || draft.maxStudents < 1 || draft.maxStudents > limit) return setError(`Max students must be between 1 and ${limit}`);

    const payload = {
      ...draft,
      title: draft.title.trim(),
      startsAt: new Date(draft.startsAt).toISOString(),
      resources: draft.resources.filter((r) => r.title.trim() && r.url.trim()).map((r) => ({ title: r.title.trim(), url: r.url.trim() })),
    };
    setBusy(true);
    try {
      if (target === 'new') await createLiveClass(payload);
      else await updateLiveClass(target.id, payload);
      onSaved(target === 'new' ? `“${payload.title}” is scheduled` : 'Class updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the class');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      variant="drawer"
      drawerWidth="max-w-[560px]"
      busy={busy}
      onClose={onClose}
      title={target === 'new' ? 'Schedule a live class' : 'Edit live class'}
      subtitle="Students see it on their dashboard and join with one click."
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="live-form" disabled={busy} className={btnPrimary}>
            {busy ? <Spinner /> : <CalendarClock size={16} aria-hidden />} {target === 'new' ? 'Schedule class' : 'Save changes'}
          </button>
        </div>
      }
    >
      <form id="live-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.84rem] font-medium text-red-700">
            {error}
          </p>
        )}

        <Field label="Class title">
          <input value={draft.title} onChange={(e) => set('title', e.target.value)} maxLength={120} placeholder="e.g. Bhagavad Gita – Chapter 2 Live Discussion" className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course" optional hint="Only students of this course can join">
            <select value={draft.courseSlug} onChange={(e) => set('courseSlug', e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Not linked to a course</option>
              {(options?.courses ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Teacher (host)">
            <select value={draft.host} onChange={(e) => set('host', e.target.value)} className={`${inputClass} cursor-pointer`}>
              {(options?.hosts ?? []).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.role === 'admin' ? '(Admin)' : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="About this class" optional>
          <textarea value={draft.description} onChange={(e) => set('description', e.target.value)} rows={3} maxLength={1000} placeholder="What will be covered? Students see this before joining." className={`${inputClass} resize-y`} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date & time">
            <input type="datetime-local" value={draft.startsAt} onChange={(e) => set('startsAt', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Duration">
            <select value={draft.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} className={`${inputClass} cursor-pointer`}>
              {[...new Set([...DURATIONS, draft.durationMin])].sort((a, b) => a - b).map((d) => (
                <option key={d} value={d}>
                  {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d} min`}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="rounded-2xl border border-line bg-cream/50 p-3.5">
          <Field label="Max students in this class">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={limit}
              value={draft.maxStudents || ''}
              onChange={(e) => set('maxStudents', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[10, 25, 50, 100].filter((n) => n <= limit).concat(limit > 100 ? [limit] : []).map((n) => (
              <button key={n} type="button" onClick={() => set('maxStudents', n)} className={`rounded-full border px-3 py-1 text-[0.76rem] font-semibold transition ${draft.maxStudents === n ? 'border-gold bg-white text-veda-bark' : 'border-line text-veda-muted hover:border-gold/60'}`}>
                {n}
              </button>
            ))}
          </div>
          <p className={`mt-2.5 flex items-start gap-2 text-[0.78rem] leading-snug ${advice.tone === 'ok' ? 'text-ok' : 'text-[#9A5A12]'}`}>
            <Info size={15} className="mt-0.5 shrink-0" aria-hidden /> {advice.text} Maximum allowed by the server: {limit} students.
          </p>
        </div>

        <Field label="Who can join">
          <select value={draft.access} onChange={(e) => set('access', e.target.value as LiveAccess)} className={`${inputClass} cursor-pointer`}>
            <option value="enrolled">Only students enrolled in the course</option>
            <option value="everyone">Every signed-in student</option>
          </select>
        </Field>

        <fieldset>
          <legend className="mb-2 text-[0.8rem] font-semibold text-veda-bark">Class features</legend>
          <ul className="divide-y divide-line/70 rounded-2xl border border-line bg-white/60">
            {FEATURES.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[0.86rem] font-semibold text-veda-bark">{f.label}</span>
                  <span className="block text-[0.74rem] leading-snug text-veda-muted">{f.hint}</span>
                </span>
                <Switch checked={draft.features[f.key]} onChange={(v) => set('features', { ...draft.features, [f.key]: v })} label={f.label} />
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[0.8rem] font-semibold text-veda-bark">
            Study material <span className="font-normal text-veda-muted">(links shown to students, optional)</span>
          </legend>
          <div className="space-y-2">
            {draft.resources.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input value={r.title} onChange={(e) => set('resources', draft.resources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Title" aria-label="Material title" className={`${inputClass} !w-2/5`} />
                <input value={r.url} onChange={(e) => set('resources', draft.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://…" aria-label="Material link" className={inputClass} />
                <button type="button" aria-label="Remove link" onClick={() => set('resources', draft.resources.filter((_, j) => j !== i))} className="flex h-[2.6rem] w-10 shrink-0 items-center justify-center rounded-xl text-veda-muted hover:bg-cream hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {draft.resources.length < 10 && (
              <button type="button" onClick={() => set('resources', [...draft.resources, { title: '', url: '' }])} className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-saffron hover:underline">
                <Plus size={15} aria-hidden /> Add a link
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}