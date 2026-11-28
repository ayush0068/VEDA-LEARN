import { CheckSquare, CircleDot, ToggleLeft, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { AssessStatus, QuestionDraft, QuestionType } from '@/types/assessments';

export const QUESTION_TYPES: { value: QuestionType; label: string; hint: string; Icon: LucideIcon }[] = [
  { value: 'single', label: 'Single choice', hint: 'One right answer', Icon: CircleDot },
  { value: 'multiple', label: 'Multiple choice', hint: 'Several right answers, partial marks', Icon: CheckSquare },
  { value: 'truefalse', label: 'True / False', hint: 'Two options', Icon: ToggleLeft },
  { value: 'short', label: 'Short answer', hint: 'Typed answer, auto-checked', Icon: Type },
];

let counter = 0;
export const newKey = () => `k${Date.now().toString(36)}${(counter += 1)}`;

export const blankQuestion = (type: QuestionType = 'single'): QuestionDraft => ({
  key: newKey(),
  type,
  text: '',
  image: '',
  points: 1,
  explanation: '',
  options:
    type === 'truefalse'
      ? [
          { text: 'True', correct: true },
          { text: 'False', correct: false },
        ]
      : type === 'short'
        ? []
        : [
            { text: '', correct: type === 'single' },
            { text: '', correct: false },
            { text: '', correct: false },
            { text: '', correct: false },
          ],
  acceptedAnswers: type === 'short' ? [''] : [],
});

export const STATUS_STYLE: Record<AssessStatus, string> = {
  published: 'bg-ok/15 text-ok',
  draft: 'bg-cream text-veda-muted',
  archived: 'bg-[#eadfd0] text-[#8a6f55]',
};

export function StatusBadge({ status }: { status: AssessStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}>{status}</span>;
}

export const formatDuration = (seconds: number) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
};

/** <input type="datetime-local"> value <-> ISO */
export const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export const dueText = (iso: string | null) => {
  if (!iso) return 'No deadline';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
};

/** a bar that grows from 0 once it is on screen */
export function GrowBar({ percent, tone = 'bg-gradient-to-r from-gold to-saffron', delay = 0, className = 'h-2' }: { percent: number; tone?: string; delay?: number; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 30);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className={`overflow-hidden rounded-full bg-cream ${className}`}>
      <div className={`h-full rounded-full ${tone} transition-[width] duration-700 ease-out`} style={{ width: on ? `${Math.max(2, Math.min(100, percent))}%` : '0%', transitionDelay: `${delay}ms` }} />
    </div>
  );
}