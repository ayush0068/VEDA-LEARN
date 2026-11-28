import { AlarmClock, ArrowRight, Award, CheckCircle2, ClipboardList, Clock, FileQuestion, Flame, HelpCircle, PencilLine, PlayCircle, RefreshCw, Sparkles, Target } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { ScoreRing, dueIn, formatWhen } from '@/components/assessments/AssessParts';
import { getHub } from '@/services/assessment.service';
import type { ApiRequestError } from '@/services/api';
import type { AssignmentCard, Hub, QuizCard } from '@/types/assessments';

export const ASSESS_BASE = '/dashboard/assignments';

type Tab = 'all' | 'quizzes' | 'assignments';
type Show = 'todo' | 'done' | 'all';

const quizDone = (q: QuizCard) => q.status === 'passed' || (q.status === 'failed' && !q.canStart) || q.window === 'closed';
const asgDone = (a: AssignmentCard) => a.state === 'submitted' || a.state === 'graded' || a.state === 'closed';

const TONE: Record<string, string> = {
  ok: 'bg-green-100 text-green-800',
  soon: 'bg-amber-100 text-amber-800',
  late: 'bg-red-100 text-red-700',
  muted: 'bg-cream text-veda-muted',
};

function Chip({ children, tone = 'muted' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.72rem] font-semibold ${TONE[tone] ?? TONE.muted}`}>{children}</span>;
}

function QuizTile({ q, i }: { q: QuizCard; i: number }) {
  const upcoming = q.window === 'upcoming';
  const closed = q.window === 'closed';
  const cta = q.inProgressId ? 'Resume quiz' : q.status === 'new' ? 'Start quiz' : q.canStart ? 'Try again' : 'View results';
  return (
    <article style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }} className={`${CARD} aq-rise flex flex-col p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(90,45,15,0.5)]`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="muted">
          <FileQuestion size={12} aria-hidden /> Quiz
        </Chip>
        {q.inProgressId && (
          <Chip tone="soon">
            <PlayCircle size={12} aria-hidden /> In progress
          </Chip>
        )}
        {q.status === 'passed' && (
          <Chip tone="ok">
            <CheckCircle2 size={12} aria-hidden /> Passed
          </Chip>
        )}
        {q.status === 'failed' && !q.inProgressId && <Chip tone="late">Not passed yet</Chip>}
        {upcoming && <Chip tone="soon">Opens {formatWhen(q.availableFrom)}</Chip>}
        {closed && <Chip tone="late">Closed</Chip>}
      </div>
      <h3 className="mt-2.5 font-display text-[1.1rem] font-bold leading-snug text-veda-bark">{q.title}</h3>
      <p className="text-xs font-medium text-saffron">{q.courseTitle}</p>
      <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[0.78rem] text-veda-muted">
        <span>{q.questionCount} questions</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden /> {q.timeLimitMin ? `${q.timeLimitMin} min` : 'No time limit'}
        </span>
        <span>Pass {q.passPercent}%</span>
      </div>
      {q.bestPercent !== null && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[0.74rem]">
            <span className="text-veda-muted">Best score</span>
            <span className="font-bold text-veda-bark">{q.bestPercent}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-gold/15">
            <div className={`h-full rounded-full ${q.bestPercent >= q.passPercent ? 'bg-gradient-to-r from-[#2e9b3e] to-[#6cc17a]' : 'bg-gradient-to-r from-gold to-saffron'}`} style={{ width: `${Math.max(3, q.bestPercent)}%` }} />
            <span className="absolute top-0 h-full w-0.5 bg-veda-bark/50" style={{ left: `${q.passPercent}%` }} title={`Pass mark ${q.passPercent}%`} />
          </div>
        </div>
      )}
      {q.attemptsLeft !== null && <p className="mt-2 text-[0.72rem] text-veda-muted">{q.attemptsLeft} of {q.maxAttempts} attempts left</p>}
      <div className="flex-1" />
      <Link to={`${ASSESS_BASE}/quiz/${q.id}`} className={`btn-primary mt-4 w-full ${upcoming ? 'opacity-70' : ''}`}>
        {cta} <ArrowRight size={15} aria-hidden />
      </Link>
    </article>
  );
}

function AssignmentTile({ a, i, now }: { a: AssignmentCard; i: number; now: number }) {
  const due = dueIn(a.dueAt, now);
  const open = a.state === 'todo' || a.state === 'overdue' || a.state === 'returned';
  const cta = a.state === 'returned' ? 'Redo & resubmit' : a.state === 'graded' ? 'See feedback' : a.state === 'submitted' ? 'View submission' : a.state === 'closed' ? 'View' : 'Start assignment';
  return (
    <article style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }} className={`${CARD} aq-rise flex flex-col p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(90,45,15,0.5)]`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="muted">
          <PencilLine size={12} aria-hidden /> Assignment
        </Chip>
        {a.state === 'graded' && (
          <Chip tone="ok">
            <Award size={12} aria-hidden /> Graded
          </Chip>
        )}
        {a.state === 'submitted' && (
          <Chip tone="ok">
            <CheckCircle2 size={12} aria-hidden /> Handed in{a.late ? ' (late)' : ''}
          </Chip>
        )}
        {a.state === 'returned' && <Chip tone="soon">Needs changes</Chip>}
        {a.state === 'closed' && <Chip tone="late">Closed</Chip>}
        {open && a.dueAt && (
          <Chip tone={due.tone}>
            <AlarmClock size={12} aria-hidden /> {due.text}
          </Chip>
        )}
      </div>
      <h3 className="mt-2.5 font-display text-[1.1rem] font-bold leading-snug text-veda-bark">{a.title}</h3>
      <p className="text-xs font-medium text-saffron">{a.courseTitle}</p>
      <p className="mt-2 text-[0.8rem] text-veda-muted">
        {a.dueAt ? `Due ${formatWhen(a.dueAt)}` : 'No deadline'} · {a.maxPoints} marks
      </p>
      {a.state === 'graded' && a.grade !== null && (
        <p className="mt-2 text-sm font-bold text-veda-bark">
          Score: {a.grade}/{a.maxPoints}
        </p>
      )}
      <div className="flex-1" />
      <Link to={`${ASSESS_BASE}/assignment/${a.id}`} className="btn-primary mt-4 w-full">
        {cta} <ArrowRight size={15} aria-hidden />
      </Link>
    </article>
  );
}

export default function DashboardAssessments() {
  const [hub, setHub] = useState<Hub | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [show, setShow] = useState<Show>('todo');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    setError('');
    getHub()
      .then(setHub)
      .catch((e: ApiRequestError) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const items = useMemo(() => {
    if (!hub) return [];
    const qs = hub.quizzes.filter((q) => (show === 'all' ? true : show === 'done' ? quizDone(q) : !quizDone(q))).map((q) => ({ kind: 'quiz' as const, q, key: q.inProgressId ? 0 : 3 }));
    const as = hub.assignments
      .filter((a) => (show === 'all' ? true : show === 'done' ? asgDone(a) : !asgDone(a)))
      .map((a) => ({ kind: 'assignment' as const, a, key: a.state === 'overdue' ? 1 : a.state === 'returned' ? 2 : 4 }));
    const all = [...qs, ...as].filter((x) => tab === 'all' || (tab === 'quizzes' ? x.kind === 'quiz' : x.kind === 'assignment'));
    // urgent first: running quiz, overdue, returned, then by due date
    return all.sort((x, y) => x.key - y.key || (x.kind === 'assignment' && y.kind === 'assignment' ? (new Date(x.a.dueAt ?? '2999-01-01').getTime() - new Date(y.a.dueAt ?? '2999-01-01').getTime()) : 0));
  }, [hub, tab, show]);

  const s = hub?.stats;
  return (
    <div className="mx-auto max-w-[1180px] space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <header className="aq-rise">
        <h1 className="font-display text-[1.9rem] font-bold leading-tight text-veda-bark sm:text-[2.3rem]">Quizzes &amp; Assignments</h1>
        <p className="text-[0.92rem] text-veda-muted">Test yourself, hand in your work and watch your progress grow.</p>
      </header>

      {error ? (
        <div className={`${CARD} p-8 text-center`}>
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <button type="button" onClick={load} className="btn-primary mt-3">
            <RefreshCw size={15} aria-hidden /> Try again
          </button>
        </div>
      ) : !hub ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((n) => (
            <div key={n} className={`${CARD} h-56 animate-pulse`} />
          ))}
        </div>
      ) : (
        <>
          <section aria-label="Your progress" className="grid gap-3 sm:grid-cols-3">
            <div className={`${CARD} aq-rise flex items-center gap-4 p-4`}>
              <ScoreRing percent={s!.avgQuizPercent} size={88} stroke={8} label="avg" />
              <div>
                <p className="font-display text-[1.05rem] font-bold text-veda-bark">Quiz average</p>
                <p className="text-[0.8rem] text-veda-muted">
                  {s!.quizzesPassed} passed · {s!.quizzesTaken} taken
                </p>
              </div>
            </div>
            <div className={`${CARD} aq-rise flex items-center gap-4 p-4`} style={{ animationDelay: '70ms' }}>
              <ScoreRing percent={s!.avgAssignmentPercent} size={88} stroke={8} label="avg" tone="stroke-[#2e9b3e]" delay={300} />
              <div>
                <p className="font-display text-[1.05rem] font-bold text-veda-bark">Assignment average</p>
                <p className="text-[0.8rem] text-veda-muted">{s!.assignmentsDone} handed in</p>
              </div>
            </div>
            <div className={`${CARD} aq-rise relative flex items-center gap-4 overflow-hidden p-4`} style={{ animationDelay: '140ms' }}>
              <span className={`flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full ${s!.assignmentsPending ? 'bg-peach text-saffron' : 'bg-green-100 text-green-700'}`}>
                {s!.assignmentsPending ? <Flame size={34} className="aq-glow" aria-hidden /> : <Sparkles size={34} aria-hidden />}
              </span>
              <div>
                <p className="font-display text-[1.6rem] font-bold leading-none text-veda-bark">{s!.assignmentsPending}</p>
                <p className="mt-1 text-[0.82rem] font-semibold text-veda-bark">{s!.assignmentsPending ? 'assignments waiting' : 'All caught up!'}</p>
                <p className="text-[0.76rem] text-veda-muted">{s!.assignmentsPending ? 'Finish them before the deadline.' : 'Great work. Nothing pending.'}</p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Type" className="inline-flex rounded-xl bg-white/70 p-1 shadow-sm ring-1 ring-gold/20">
              {([
                ['all', 'All', Target],
                ['quizzes', 'Quizzes', HelpCircle],
                ['assignments', 'Assignments', ClipboardList],
              ] as const).map(([v, label, Icon]) => (
                <button key={v} role="tab" aria-selected={tab === v} type="button" onClick={() => setTab(v)} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.84rem] font-semibold transition ${tab === v ? 'bg-veda-brown text-ivory shadow' : 'text-veda-muted hover:text-veda-bark'}`}>
                  <Icon size={14} aria-hidden /> {label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Show" className="flex gap-1.5">
              {([
                ['todo', 'To do'],
                ['done', 'Completed'],
                ['all', 'Everything'],
              ] as const).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={show === v} onClick={() => setShow(v)} className={`rounded-full border px-3.5 py-1 text-[0.8rem] font-semibold transition ${show === v ? 'border-gold bg-gold-pale/70 text-veda-bark' : 'border-gold/25 bg-white/60 text-veda-muted hover:border-gold/60'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className={`${CARD} aq-pop flex flex-col items-center p-10 text-center`}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-peach text-saffron">
                <Sparkles size={28} aria-hidden />
              </span>
              <p className="mt-3 font-display text-[1.35rem] font-bold text-veda-bark">{hub.quizzes.length + hub.assignments.length === 0 ? 'Nothing here yet' : show === 'todo' ? 'You are all caught up!' : 'Nothing to show here'}</p>
              <p className="mt-1 max-w-sm text-sm text-veda-muted">{hub.quizzes.length + hub.assignments.length === 0 ? 'Quizzes and assignments of your courses will appear here as soon as your teachers publish them.' : 'Change the filters above to see the rest.'}</p>
              <Link to="/dashboard/my-courses" className="btn-primary mt-4">
                Go to My Courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((x, i) => (x.kind === 'quiz' ? <QuizTile key={`q${x.q.id}`} q={x.q} i={i} /> : <AssignmentTile key={`a${x.a.id}`} a={x.a} i={i} now={now} />))}
            </div>
          )}
        </>
      )}
    </div>
  );
}