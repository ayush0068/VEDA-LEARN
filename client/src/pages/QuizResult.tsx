import { ArrowLeft, Check, CircleHelp, Clock, Eye, EyeOff, Loader2, PartyPopper, RotateCcw, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { Confetti, ScoreRing, formatDuration } from '@/components/assessments/AssessParts';
import { getAttempt } from '@/services/assessment.service';
import type { ApiRequestError } from '@/services/api';
import type { Review, ReviewQuestion } from '@/types/assessments';
import { ASSESS_BASE } from './DashboardAssessments';

const message = (percent: number, passed: boolean) =>
  percent === 100 ? ['Perfect score!', 'Not a single mistake. Wonderful.'] : percent >= 85 ? ['Excellent work!', 'You have a very strong grip on this topic.'] : passed ? ['You passed!', 'Well done — keep the momentum going.'] : percent >= 40 ? ['Almost there', 'Review the explanations below and try again — you can do it.'] : ['Keep learning', 'Revisit the lessons, then give it another go.'];

function Answer({ q }: { q: ReviewQuestion }) {
  if (q.type === 'short') {
    return (
      <div className="mt-3 space-y-1.5 text-sm">
        <p className={`rounded-xl px-3 py-2 ${q.correct ? 'bg-green-100 text-green-900' : 'bg-red-50 text-red-800'}`}>
          <span className="font-semibold">Your answer:</span> {q.yourText || <em>not answered</em>}
        </p>
        {!q.correct && q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
          <p className="rounded-xl bg-green-100 px-3 py-2 text-green-900">
            <span className="font-semibold">Accepted:</span> {q.acceptedAnswers.join(' / ')}
          </p>
        )}
      </div>
    );
  }
  return (
    <ul className="mt-3 space-y-1.5">
      {q.options.map((o) => {
        const picked = q.yourSelected.includes(o.id);
        const right = q.correctOptionIds?.includes(o.id);
        const cls = right ? 'border-green-500/60 bg-green-100 text-green-900' : picked ? 'border-red-400/60 bg-red-50 text-red-800' : 'border-gold/20 bg-white/60 text-veda-text';
        return (
          <li key={o.id} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${cls}`}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">{right ? <Check size={16} aria-label="Correct answer" /> : picked ? <X size={16} aria-label="Your wrong answer" /> : null}</span>
            <span className="flex-1">{o.text}</span>
            {picked && <span className="text-[0.68rem] font-bold uppercase tracking-wide opacity-70">Your pick</span>}
          </li>
        );
      })}
    </ul>
  );
}

export default function QuizResult() {
  const { attemptId = '' } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const fresh = Boolean((location.state as { fresh?: boolean } | null)?.fresh);
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [only, setOnly] = useState<'all' | 'wrong'>('all');

  useEffect(() => {
    getAttempt(attemptId)
      .then((v) => {
        if (v.inProgress) nav(`/quiz/${attemptId}`, { replace: true });
        else setData(v);
      })
      .catch((e: ApiRequestError) => setError(e));
  }, [attemptId, nav]);

  const list = useMemo(() => (data ? data.questions.filter((q) => only === 'all' || !q.correct) : []), [data, only]);

  if (error)
    return (
      <div className="px-4 py-10">
        <div className={`${CARD} mx-auto max-w-md p-8 text-center`}>
          <h1 className="font-display text-2xl font-bold text-veda-bark">Result not found</h1>
          <p className="mt-2 text-sm text-veda-muted">{error.message}</p>
          <Link to={ASSESS_BASE} className="btn-primary mt-5">
            Back
          </Link>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-saffron" />
      </div>
    );

  const { attempt: a, counts } = data;
  const [headline, sub] = message(a.percent, a.passed);

  return (
    <div className="mx-auto max-w-[860px] space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <Confetti run={fresh && a.passed} />
      <Link to={`${ASSESS_BASE}/quiz/${data.quiz.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-veda-muted transition hover:text-saffron">
        <ArrowLeft size={15} aria-hidden /> {data.quiz.title}
      </Link>

      <section className={`${CARD} aq-pop relative overflow-hidden p-6 text-center sm:p-9`} aria-labelledby="res-h">
        <div className={`pointer-events-none absolute left-1/2 top-0 h-52 w-72 -translate-x-1/2 rounded-full blur-3xl aq-glow ${a.passed ? 'bg-green-300/30' : 'bg-gold/25'}`} aria-hidden />
        <div className="relative flex flex-col items-center">
          <ScoreRing percent={a.percent} size={168} stroke={13} label={a.passed ? 'passed' : 'score'} tone={a.passed ? 'stroke-[#2e9b3e]' : 'stroke-saffron'} />
          <h1 id="res-h" className="mt-4 flex items-center gap-2 font-display text-[1.9rem] font-bold text-veda-bark sm:text-[2.2rem]">
            {a.passed && <PartyPopper size={26} className="text-saffron" aria-hidden />} {headline}
          </h1>
          <p className="mt-1 max-w-md text-[0.92rem] text-veda-muted">{a.timedOut ? 'Time ran out, so your saved answers were submitted. ' : ''}{sub}</p>
          <p className="mt-2 text-sm font-semibold text-veda-bark">
            {a.score} / {a.total} marks · pass mark {data.quiz.passPercent}%
          </p>

          <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2.5">
            {[
              ['Correct', counts.correct, 'bg-green-100 text-green-800', Check],
              ['Wrong', counts.wrong, 'bg-red-50 text-red-700', X],
              ['Skipped', counts.skipped, 'bg-cream text-veda-muted', CircleHelp],
            ].map(([label, n, tone, Icon], i) => {
              const I = Icon as typeof Check;
              return (
                <div key={label as string} style={{ animationDelay: `${400 + i * 90}ms` }} className={`aq-rise rounded-2xl px-2 py-3 ${tone as string}`}>
                  <I size={16} className="mx-auto" aria-hidden />
                  <p className="font-display text-[1.5rem] font-bold leading-none">{n as number}</p>
                  <p className="mt-0.5 text-[0.72rem] font-medium">{label as string}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-veda-muted">
            <Clock size={12} aria-hidden /> Finished in {formatDuration(a.timeTakenSec)} · attempt {a.attemptNo}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link to={`${ASSESS_BASE}/quiz/${data.quiz.id}`} className="btn-primary">
              <RotateCcw size={15} aria-hidden /> {a.passed ? 'View attempts' : 'Try again'}
            </Link>
            <Link to={ASSESS_BASE} className="btn-outline">
              <Sparkles size={15} aria-hidden /> More quizzes &amp; assignments
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="rev">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="rev" className="font-display text-[1.45rem] font-bold text-veda-bark">
            Review your answers
          </h2>
          <div role="group" aria-label="Filter" className="flex gap-1.5">
            {(['all', 'wrong'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={only === v} onClick={() => setOnly(v)} className={`rounded-full border px-3.5 py-1 text-[0.8rem] font-semibold transition ${only === v ? 'border-gold bg-gold-pale/70 text-veda-bark' : 'border-gold/25 bg-white/60 text-veda-muted hover:border-gold/60'}`}>
                {v === 'all' ? 'All questions' : 'Only mistakes'}
              </button>
            ))}
          </div>
        </div>

        {!data.revealed && (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm text-veda-muted">
            <EyeOff size={16} aria-hidden /> {data.quiz.showAnswers === 'after_pass' ? 'Right answers are shown once you pass this quiz.' : 'Your teacher keeps the right answers hidden for this quiz.'}
          </p>
        )}

        {list.length === 0 ? (
          <div className={`${CARD} p-8 text-center text-sm text-veda-muted`}>No mistakes to show. Brilliant!</div>
        ) : (
          <ol className="space-y-3">
            {list.map((q, i) => (
              <li key={q.id} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} className={`${CARD} aq-rise p-4 sm:p-5`}>
                <div className="flex items-start gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${q.correct ? 'bg-green-100 text-green-800' : q.answered ? 'bg-red-50 text-red-700' : 'bg-cream text-veda-muted'}`}>{q.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-veda-bark">{q.text}</p>
                    <p className="mt-0.5 text-xs text-veda-muted">
                      {q.correct ? 'Correct' : q.answered ? (q.earned > 0 ? 'Partly correct' : 'Incorrect') : 'Not answered'} · {q.earned}/{q.points} marks
                    </p>
                  </div>
                </div>
                {data.revealed ? (
                  <Answer q={q} />
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-veda-muted">
                    <Eye size={13} aria-hidden /> {q.correct ? 'You got this right.' : 'You did not get full marks here.'}
                  </p>
                )}
                {data.revealed && q.explanation && (
                  <p className="mt-3 rounded-xl bg-[#fdf1da] px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-veda-text">
                    <span className="font-semibold text-saffron">Why: </span>
                    {q.explanation}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}