import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2, X } from 'lucide-react';
import { inputClass } from '@/components/common/ui';
import type { QuestionDraft, QuestionType } from '@/types/assessments';
import { QUESTION_TYPES, blankQuestion } from './assessUtils';

interface Props {
  index: number;
  total: number;
  value: QuestionDraft;
  open: boolean;
  readOnly?: boolean;
  onToggle: () => void;
  onChange: (next: QuestionDraft) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function QuestionEditor({ index, total, value: q, open, readOnly, onToggle, onChange, onMove, onDuplicate, onDelete }: Props) {
  const meta = QUESTION_TYPES.find((t) => t.value === q.type)!;
  const set = (patch: Partial<QuestionDraft>) => onChange({ ...q, ...patch });

  const changeType = (type: QuestionType) => {
    if (type === q.type) return;
    const base = blankQuestion(type);
    // keep what was typed; for choice <-> choice keep the options too
    const keepOptions = (type === 'single' || type === 'multiple') && (q.type === 'single' || q.type === 'multiple');
    let options = keepOptions ? q.options : base.options;
    if (type === 'single' && keepOptions) {
      const first = options.findIndex((o) => o.correct);
      options = options.map((o, i) => ({ ...o, correct: i === Math.max(0, first) }));
    }
    set({ type, options, acceptedAnswers: base.acceptedAnswers });
  };

  const setOption = (i: number, patch: Partial<QuestionDraft['options'][number]>) => set({ options: q.options.map((o, n) => (n === i ? { ...o, ...patch } : o)) });
  const markCorrect = (i: number) => {
    if (q.type === 'multiple') setOption(i, { correct: !q.options[i].correct });
    else set({ options: q.options.map((o, n) => ({ ...o, correct: n === i })) });
  };

  const preview = q.text.trim() || 'Untitled question';
  // empty extra options are ignored (they are dropped when saving)
  const filled = q.options.filter((o) => o.text.trim());
  const incomplete = !q.text.trim() || (q.type === 'short' ? !q.acceptedAnswers.some((a) => a.trim()) : filled.length < 2 || !filled.some((o) => o.correct));

  return (
    <div className={`rounded-2xl border bg-card/90 shadow-card transition ${open ? 'border-gold/60' : 'border-line'}`}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-peach font-display text-[0.95rem] font-bold text-saffron">{index + 1}</span>
          <span className="min-w-0">
            <span className="block truncate text-[0.9rem] font-semibold text-veda-bark">{preview}</span>
            <span className="flex items-center gap-2 text-[0.72rem] text-veda-muted">
              <meta.Icon size={12} aria-hidden /> {meta.label} · {q.points} {q.points === 1 ? 'mark' : 'marks'}
              {incomplete && <span className="rounded-full bg-red-100 px-1.5 py-px text-[0.62rem] font-bold uppercase text-red-700">Incomplete</span>}
            </span>
          </span>
          <ChevronDown size={18} className={`ml-auto shrink-0 text-veda-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {!readOnly && (
          <div className="flex shrink-0 items-center">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move question ${index + 1} up`} className="rounded-lg p-1.5 text-veda-muted hover:bg-cream disabled:opacity-30">
              <ArrowUp size={16} />
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move question ${index + 1} down`} className="rounded-lg p-1.5 text-veda-muted hover:bg-cream disabled:opacity-30">
              <ArrowDown size={16} />
            </button>
            <button type="button" onClick={onDuplicate} aria-label={`Duplicate question ${index + 1}`} className="rounded-lg p-1.5 text-veda-muted hover:bg-cream">
              <Copy size={16} />
            </button>
            <button type="button" onClick={onDelete} aria-label={`Delete question ${index + 1}`} className="rounded-lg p-1.5 text-red-700 hover:bg-red-50">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {open && (
        <fieldset disabled={readOnly} className="animate-fade-in space-y-3.5 border-t border-line/70 p-4">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Question type">
            {QUESTION_TYPES.map((t) => (
              <button key={t.value} type="button" role="radio" aria-checked={q.type === t.value} onClick={() => changeType(t.value)} title={t.hint} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition ${q.type === t.value ? 'border-gold bg-gold-pale/60 text-veda-bark' : 'border-line bg-white/70 text-veda-muted hover:border-gold/60'}`}>
                <t.Icon size={14} aria-hidden /> {t.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Question</span>
            <textarea value={q.text} onChange={(e) => set({ text: e.target.value })} rows={2} maxLength={1000} placeholder="Type the question…" className={inputClass} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
              Image link <span className="font-normal text-veda-muted">(optional)</span>
            </span>
            <input value={q.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://…" className={inputClass} />
          </label>

          {q.type === 'short' ? (
            <div>
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Accepted answers</span>
              <p className="mb-2 text-[0.74rem] text-veda-muted">Capital letters and extra spaces are ignored. Add every spelling you accept.</p>
              <div className="space-y-2">
                {q.acceptedAnswers.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={a} onChange={(e) => set({ acceptedAnswers: q.acceptedAnswers.map((x, n) => (n === i ? e.target.value : x)) })} aria-label={`Accepted answer ${i + 1}`} className={inputClass} />
                    {q.acceptedAnswers.length > 1 && (
                      <button type="button" onClick={() => set({ acceptedAnswers: q.acceptedAnswers.filter((_, n) => n !== i) })} aria-label={`Remove answer ${i + 1}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-veda-muted hover:bg-cream">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.acceptedAnswers.length < 10 && (
                <button type="button" onClick={() => set({ acceptedAnswers: [...q.acceptedAnswers, ''] })} className="mt-2 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-saffron hover:underline">
                  <Plus size={14} /> Add another spelling
                </button>
              )}
            </div>
          ) : (
            <div>
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
                Options <span className="font-normal text-veda-muted">— {q.type === 'multiple' ? 'tick every correct one' : 'select the correct one'}</span>
              </span>
              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <div key={o.id ?? i} className={`flex items-center gap-2 rounded-xl border p-1.5 transition ${o.correct ? 'border-ok/50 bg-ok/10' : 'border-line bg-white/60'}`}>
                    <button
                      type="button"
                      role={q.type === 'multiple' ? 'checkbox' : 'radio'}
                      aria-checked={o.correct}
                      aria-label={`Option ${i + 1} is correct`}
                      onClick={() => markCorrect(i)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 text-white transition ${q.type === 'multiple' ? 'rounded-md' : 'rounded-full'} ${o.correct ? 'border-ok bg-ok' : 'border-[#d8c9b2] bg-white'}`}
                    >
                      {o.correct && <span className="text-[0.8rem] leading-none">✓</span>}
                    </button>
                    {q.type === 'truefalse' ? (
                      <span className="flex-1 px-2 text-[0.9rem] font-medium text-veda-bark">{o.text}</span>
                    ) : (
                      <input value={o.text} onChange={(e) => setOption(i, { text: e.target.value })} maxLength={300} placeholder={`Option ${i + 1}`} aria-label={`Option ${i + 1} text`} className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-base text-veda-bark placeholder:text-veda-muted/70 focus:outline-none sm:text-[0.9rem]" />
                    )}
                    {q.type !== 'truefalse' && q.options.length > 2 && (
                      <button type="button" onClick={() => set({ options: q.options.filter((_, n) => n !== i) })} aria-label={`Remove option ${i + 1}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-veda-muted hover:bg-cream">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.type !== 'truefalse' && q.options.length < 8 && (
                <button type="button" onClick={() => set({ options: [...q.options, { text: '', correct: false }] })} className="mt-2 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-saffron hover:underline">
                  <Plus size={14} /> Add option
                </button>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Marks</span>
              <input type="number" min={1} max={100} value={q.points} onChange={(e) => set({ points: Number(e.target.value) })} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
                Explanation <span className="font-normal text-veda-muted">(shown after the quiz)</span>
              </span>
              <input value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} maxLength={1000} placeholder="Why is this the right answer?" className={inputClass} />
            </label>
          </div>
        </fieldset>
      )}
    </div>
  );
}