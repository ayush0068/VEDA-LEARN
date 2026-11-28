import { AlertTriangle, ArrowLeft, ArrowRight, Check, CloudOff, Flag, Loader2, Send, Timer, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BG, clock } from '@/components/assessments/AssessParts';
import { getAttempt, saveAnswer, submitQuiz } from '@/services/assessment.service';
import type { ApiRequestError } from '@/services/api';
import type { RunPayload, RunQuestion, SavedAnswer } from '@/types/assessments';
import { ASSESS_BASE } from './DashboardAssessments';

type Answers = Record<string, SavedAnswer>;
type SaveState = 'saved' | 'saving' | 'offline';

const LETTERS = 'ABCDEFGH';

/** /quiz/:attemptId - the full-screen quiz. Answers are saved as you go; the timer is kept by the server. */
export default function QuizPlayer() {
  const { attemptId = '' } = useParams();
  const nav = useNavigate();

  const [run, setRun] = useState<RunPayload | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [left, setLeft] = useState<number | null>(null);
  const [timesUp, setTimesUp] = useState(false);
  const [announce, setAnnounce] = useState('');

  const offset = useRef(0); // server clock - browser clock
  const answersRef = useRef<Answers>({});
  const queue = useRef<Map<string, SavedAnswer>>(new Map());
  const inFlight = useRef(false);
  const timers = useRef<Map<string, number>>(new Map());
  const submitted = useRef(false);
  const retry = useRef(0);

  // ---- load ----
  useEffect(() => {
    let alive = true;
    getAttempt(attemptId)
      .then((v) => {
        if (!alive) return;
        if (!v.inProgress) {
          nav(`${ASSESS_BASE}/attempt/${attemptId}`, { replace: true });
          return;
        }
        offset.current = new Date(v.attempt.serverNow).getTime() - Date.now();
        const map: Answers = Object.fromEntries(v.saved.map((a) => [a.question, a]));
        answersRef.current = map;
        setAnswers(map);
        setRun(v);
      })
      .catch((e: ApiRequestError) => alive && setError(e));
    return () => {
      alive = false;
    };
  }, [attemptId, nav]);

  // ---- saving (queue + retry, so a weak network never loses an answer) ----
  const flush = useCallback(async () => {
    if (inFlight.current || submitted.current) return;
    const next = queue.current.entries().next();
    if (next.done) {
      setSaveState('saved');
      return;
    }
    const [key, answer] = next.value;
    inFlight.current = true;
    setSaveState('saving');
    try {
      await saveAnswer(attemptId, answer);
      if (queue.current.get(key) === answer) queue.current.delete(key);
      retry.current = 0;
      inFlight.current = false;
      void flush();
    } catch (e) {
      inFlight.current = false;
      const status = (e as ApiRequestError).status;
      if (status === 409 || status === 404) {
        queue.current.clear();
        setSaveState('saved');
        return;
      }
      setSaveState('offline');
      retry.current += 1;
      window.setTimeout(() => void flush(), Math.min(15000, 1000 * 2 ** retry.current));
    }
  }, [attemptId]);

  useEffect(() => {
    const online = () => void flush();
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [flush]);

  const setAnswer = useCallback(
    (q: RunQuestion, patch: Partial<SavedAnswer>, delay = 0) => {
      const current = answersRef.current[q.id] ?? { question: q.id, selected: [], text: '' };
      const next = { ...current, ...patch };
      answersRef.current = { ...answersRef.current, [q.id]: next };
      setAnswers(answersRef.current);
      setSaveState('saving');
      window.clearTimeout(timers.current.get(q.id));
      timers.current.set(
        q.id,
        window.setTimeout(() => {
          queue.current.set(q.id, next);
          void flush();
        }, delay),
      );
    },
    [flush],
  );

  /** sends everything that is still waiting (used before leaving the page) */
  const drain = useCallback(async () => {
    timers.current.forEach((t, id) => {
      window.clearTimeout(t);
      if (answersRef.current[id]) queue.current.set(id, answersRef.current[id]);
    });
    timers.current.clear();
    for (let i = 0; i < 20 && (queue.current.size > 0 || inFlight.current); i += 1) {
      void flush();
      await new Promise((r) => window.setTimeout(r, 150));
    }
  }, [flush]);

  // ---- submit ----
  const submit = useCallback(
    async (auto = false) => {
      if (submitted.current && !auto) return;
      setSubmitError('');
      setSubmitting(true);
      timers.current.forEach((t) => window.clearTimeout(t));
      try {
        await submitQuiz(attemptId, Object.values(answersRef.current));
        submitted.current = true;
        nav(`${ASSESS_BASE}/attempt/${attemptId}`, { replace: true, state: { fresh: true } });
      } catch (e) {
        setSubmitting(false);
        setSubmitError((e as ApiRequestError).message || 'Could not submit. Check your connection and try again.');
      }
    },
    [attemptId, nav],
  );

  // ---- timer (server time) ----
  const expiresAt = run?.attempt.expiresAt ? new Date(run.attempt.expiresAt).getTime() : null;
  const totalMs = run && expiresAt ? expiresAt - new Date(run.attempt.startedAt).getTime() : 0;
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - (Date.now() + offset.current)) / 1000));
      setLeft(remaining);
      if (remaining === 300) setAnnounce('5 minutes left');
      if (remaining === 60) setAnnounce('1 minute left');
      if (remaining === 0 && !submitted.current) {
        setTimesUp(true);
        void submit(true);
      }
    };
    tick();
    const t = window.setInterval(tick, 250);
    return () => window.clearInterval(t);
  }, [expiresAt, submit]);

  // ---- leaving the page ----
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const questions = run?.questions ?? [];
  const q = questions[idx];

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= questions.length || to === idx) return;
      setDir(to > idx ? 'next' : 'prev');
      setIdx(to);
      setReviewing(false);
    },
    [idx, questions.length],
  );

  const pick = useCallback(
    (qq: RunQuestion, optionId: string) => {
      const cur = answersRef.current[qq.id]?.selected ?? [];
      if (qq.multiple) setAnswer(qq, { selected: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] });
      else setAnswer(qq, { selected: cur[0] === optionId ? [] : [optionId] });
    },
    [setAnswer],
  );

  // keyboard: arrows, 1-9 / A-H to answer, F to flag
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!q || reviewing || leaving || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key.toLowerCase() === 'f') setFlags((f) => new Set(f.has(q.id) ? [...f].filter((x) => x !== q.id) : [...f, q.id]));
      else {
        const n = /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : LETTERS.indexOf(e.key.toUpperCase());
        if (n >= 0 && q.options[n]) pick(q, q.options[n].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, idx, go, pick, reviewing, leaving]);

  const answered = useMemo(() => questions.filter((x) => (answers[x.id]?.selected.length ?? 0) > 0 || (answers[x.id]?.text ?? '').trim()).length, [questions, answers]);
  const isAnswered = (id: string) => (answers[id]?.selected.length ?? 0) > 0 || Boolean((answers[id]?.text ?? '').trim());

  if (error)
    return (
      <div className={`${BG} flex items-center justify-center px-5`}>
        <div className="max-w-md text-center">
          <h1 className="font-display text-[1.7rem] font-bold text-veda-bark">{error.status === 404 ? 'Quiz not found' : 'Could not open the quiz'}</h1>
          <p className="mt-2 text-sm text-veda-muted">{error.message}</p>
          <button type="button" onClick={() => nav(ASSESS_BASE)} className="btn-primary mt-5">
            Back to Quizzes &amp; Assignments
          </button>
        </div>
      </div>
    );
  if (!run || !q)
    return (
      <div className={`${BG} flex items-center justify-center`} role="status" aria-label="Loading the quiz">
        <Loader2 className="h-9 w-9 animate-spin text-saffron" />
      </div>
    );

  const ans = answers[q.id];
  const urgent = left !== null && left <= 60;
  const low = left !== null && totalMs > 0 && left * 1000 <= totalMs * 0.25;
  const progress = ((idx + 1) / questions.length) * 100;

  return (
    <div className={`${BG} flex flex-col`}>
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>

      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-gold/25 bg-[#fff8ea]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <button type="button" onClick={() => setLeaving(true)} aria-label="Leave the quiz" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-veda-muted transition hover:bg-gold/15 hover:text-veda-bark">
            <X size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8rem] font-semibold text-veda-bark">{run.quiz.title}</p>
            <p className="text-[0.7rem] text-veda-muted">
              Question {idx + 1} of {questions.length} · {answered} answered
            </p>
          </div>
          <span className={`hidden items-center gap-1 text-[0.7rem] sm:inline-flex ${saveState === 'offline' ? 'font-semibold text-red-700' : 'text-veda-muted'}`} role="status">
            {saveState === 'saving' ? <Loader2 size={12} className="animate-spin" /> : saveState === 'offline' ? <CloudOff size={12} /> : <Check size={12} className="text-green-700" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'offline' ? 'Offline — retrying' : 'Saved'}
          </span>
          {left !== null && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[0.9rem] font-bold tabular-nums ${urgent ? 'aq-urgent bg-red-100 text-red-700' : low ? 'bg-amber-100 text-amber-800' : 'bg-white text-veda-bark ring-1 ring-gold/30'}`} role="timer" aria-label={`${clock(left)} left`}>
              <Timer size={15} aria-hidden /> {clock(left)}
            </span>
          )}
        </div>
        <div className="h-1 bg-gold/15" aria-hidden>
          <div className="h-full bg-gradient-to-r from-gold to-saffron transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        {/* question map */}
        <nav aria-label="Questions" className="mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          {questions.map((x, i) => (
            <button
              key={x.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Question ${i + 1}${isAnswered(x.id) ? ', answered' : ''}${flags.has(x.id) ? ', flagged' : ''}`}
              aria-current={i === idx}
              className={`relative flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg text-[0.78rem] font-bold transition ${i === idx ? 'scale-110 bg-veda-brown text-ivory shadow' : isAnswered(x.id) ? 'bg-gold/30 text-veda-bark' : 'bg-white text-veda-muted ring-1 ring-gold/25 hover:ring-gold/60'}`}
            >
              {i + 1}
              {flags.has(x.id) && <Flag size={9} className="absolute -right-0.5 -top-0.5 fill-saffron text-saffron" aria-hidden />}
            </button>
          ))}
        </nav>
      </header>

      {/* question */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-8">
        {timesUp && (
          <div role="alert" className="aq-pop mb-4 flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
            <AlertTriangle size={18} aria-hidden /> Time is up — submitting your answers…
          </div>
        )}
        <div key={q.id} className={dir === 'next' ? 'aq-next' : 'aq-prev'}>
          <div className="rounded-3xl border border-gold/25 bg-[#fffaf1]/95 p-5 shadow-[0_18px_40px_-24px_rgba(90,45,15,0.45)] sm:p-7">
            <div className="mb-3 flex items-center justify-between gap-2 text-[0.72rem] font-semibold uppercase tracking-wide text-saffron">
              <span>{q.type === 'multiple' ? 'Select all that apply' : q.type === 'short' ? 'Type your answer' : q.type === 'truefalse' ? 'True or false' : 'Choose one'}</span>
              <span className="rounded-md bg-gold/15 px-2 py-0.5 text-veda-brown">
                {q.points} {q.points === 1 ? 'mark' : 'marks'}
              </span>
            </div>
            <h1 className="font-display text-[1.3rem] font-bold leading-snug text-veda-bark sm:text-[1.6rem]">{q.text}</h1>
            {q.image && <img src={q.image} alt="" className="mt-4 max-h-64 w-full rounded-2xl object-contain" />}

            {q.type === 'short' ? (
              <div className="mt-5">
                <label htmlFor="short-answer" className="sr-only">
                  Your answer
                </label>
                <input id="short-answer" key={q.id} value={ans?.text ?? ''} onChange={(e) => setAnswer(q, { text: e.target.value }, 500)} maxLength={500} autoComplete="off" placeholder="Type here…" className="w-full rounded-2xl border-2 border-gold/30 bg-white px-4 py-3.5 text-base text-veda-bark transition placeholder:text-veda-muted/70 focus:border-saffron focus:outline-none focus:ring-4 focus:ring-gold/20" />
              </div>
            ) : (
              <div className="mt-5 space-y-2.5" role={q.multiple ? 'group' : 'radiogroup'} aria-label="Options">
                {q.options.map((o, i) => {
                  const on = ans?.selected.includes(o.id) ?? false;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role={q.multiple ? 'checkbox' : 'radio'}
                      aria-checked={on}
                      onClick={() => pick(q, o.id)}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className={`aq-rise group flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition duration-200 active:scale-[0.99] ${on ? 'border-saffron bg-gradient-to-r from-[#fdecd0] to-[#fff3dc] shadow-md' : 'border-gold/25 bg-white hover:-translate-y-0.5 hover:border-gold/70 hover:shadow'}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 text-[0.85rem] font-bold transition ${q.multiple ? 'rounded-lg' : 'rounded-full'} ${on ? 'border-saffron bg-saffron text-white' : 'border-gold/40 text-veda-muted group-hover:border-gold'}`}>
                        {on ? (
                          <svg viewBox="0 0 24 24" width="18" height="18" className="aq-check" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                          </svg>
                        ) : (
                          LETTERS[i]
                        )}
                      </span>
                      <span className="text-[0.98rem] font-medium leading-snug text-veda-bark">{o.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* bottom bar */}
      <footer className="sticky bottom-0 z-30 border-t border-gold/25 bg-[#fff8ea]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-white px-4 py-2.5 text-sm font-semibold text-veda-bark transition hover:border-gold disabled:opacity-40">
            <ArrowLeft size={16} aria-hidden /> <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            type="button"
            onClick={() => setFlags((f) => new Set(f.has(q.id) ? [...f].filter((x) => x !== q.id) : [...f, q.id]))}
            aria-pressed={flags.has(q.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${flags.has(q.id) ? 'border-saffron bg-peach text-saffron' : 'border-gold/30 bg-white text-veda-muted hover:border-gold'}`}
          >
            <Flag size={15} className={flags.has(q.id) ? 'fill-saffron' : ''} aria-hidden /> <span className="hidden sm:inline">{flags.has(q.id) ? 'Flagged' : 'Flag for review'}</span>
          </button>
          <div className="flex-1" />
          {idx < questions.length - 1 ? (
            <button type="button" onClick={() => go(idx + 1)} className="btn-primary">
              Next <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <button type="button" onClick={() => setReviewing(true)} className="btn-primary">
              Review &amp; submit <Send size={15} aria-hidden />
            </button>
          )}
          {idx < questions.length - 1 && (
            <button type="button" onClick={() => setReviewing(true)} className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-veda-brown underline-offset-2 hover:underline sm:inline">
              Finish
            </button>
          )}
        </div>
      </footer>

      {/* review before submitting */}
      {reviewing && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-veda-bark/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Review your answers">
          <div className="aq-pop max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-ivory p-5 shadow-2xl sm:rounded-3xl">
            <h2 className="font-display text-[1.5rem] font-bold text-veda-bark">Ready to submit?</h2>
            <p className="mt-1 text-sm text-veda-muted">
              You answered <strong className="text-veda-bark">{answered}</strong> of {questions.length} questions.
              {questions.length - answered > 0 && <span className="font-semibold text-red-700"> {questions.length - answered} unanswered.</span>}
              {flags.size > 0 && <span> {flags.size} flagged.</span>}
            </p>
            <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8">
              {questions.map((x, i) => (
                <button key={x.id} type="button" onClick={() => go(i)} className={`relative flex h-10 items-center justify-center rounded-xl text-sm font-bold transition hover:scale-105 ${isAnswered(x.id) ? 'bg-gold/30 text-veda-bark' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                  {i + 1}
                  {flags.has(x.id) && <Flag size={10} className="absolute right-1 top-1 fill-saffron text-saffron" aria-hidden />}
                </button>
              ))}
            </div>
            {submitError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setReviewing(false)} disabled={submitting} className="rounded-xl border border-gold/30 bg-white px-5 py-2.5 text-sm font-semibold text-veda-bark hover:border-gold disabled:opacity-50">
                Keep working
              </button>
              <button type="button" onClick={() => submit()} disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />} Submit quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* leave */}
      {leaving && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-veda-bark/50 p-4" role="dialog" aria-modal="true" aria-label="Leave the quiz">
          <div className="aq-pop w-full max-w-sm rounded-3xl bg-ivory p-5 shadow-2xl">
            <h2 className="font-display text-[1.35rem] font-bold text-veda-bark">Leave this quiz?</h2>
            <p className="mt-1.5 text-sm text-veda-muted">Your answers are saved and you can continue later{left !== null ? ', but the timer keeps running' : ''}.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setLeaving(false)} className="flex-1 rounded-xl border border-gold/30 bg-white px-4 py-2.5 text-sm font-semibold text-veda-bark hover:border-gold">
                Stay
              </button>
              <button
                type="button"
                onClick={async () => {
                  await drain();
                  submitted.current = true;
                  nav(ASSESS_BASE);
                }}
                className="btn-primary flex-1"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}