import { ArrowLeft, ArrowRight, CalendarClock, Clock, Loader2, Lock, Repeat, Target, ListChecks, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { ScoreRing, formatDuration, formatWhen } from '@/components/assessments/AssessParts';
import { getQuizIntro, startQuiz } from '@/services/assessment.service';
import type { ApiRequestError } from '@/services/api';
import type { QuizIntro as Intro } from '@/types/assessments';
import { ASSESS_BASE } from './DashboardAssessments';

const when = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export default function QuizIntro() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<Intro | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    getQuizIntro(id).then(setData).catch((e: ApiRequestError) => setError(e));
  }, [id]);

  const start = async () => {
    setStarting(true);
    setStartError('');
    try {
      const run = await startQuiz(id);
      nav(`/quiz/${run.attempt.id}`);
    } catch (e) {
      setStartError((e as ApiRequestError).message);
      setStarting(false);
    }
  };

  if (error)
    return (
      <div className="px-4 py-10">
        <div className={`${CARD} mx-auto max-w-md p-8 text-center`}>
          <h1 className="font-display text-2xl font-bold text-veda-bark">{error.status === 403 ? 'Enroll to open this quiz' : 'Quiz not found'}</h1>
          <p className="mt-2 text-sm text-veda-muted">{error.message}</p>
          <Link to={ASSESS_BASE} className="btn-primary mt-5">
            Back to Quizzes &amp; Assignments
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

  const q = data.quiz;
  const blocked = q.window === 'upcoming' ? `Opens on ${when.format(new Date(q.availableFrom!))}` : q.window === 'closed' ? 'This quiz is closed' : !q.canStart ? 'You have used all your attempts' : '';
  const label = q.inProgressId ? 'Resume quiz' : data.attempts.length ? 'Try again' : 'Start quiz';

  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <Link to={ASSESS_BASE} className="inline-flex items-center gap-1.5 text-sm font-medium text-veda-muted transition hover:text-saffron">
        <ArrowLeft size={15} aria-hidden /> Quizzes &amp; Assignments
      </Link>

      <section className={`${CARD} aq-rise relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/15 blur-2xl aq-glow" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-saffron">{q.courseTitle}</p>
        <h1 className="mt-1 font-display text-[1.9rem] font-bold leading-tight text-veda-bark sm:text-[2.3rem]">{q.title}</h1>
        {q.instructions && <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-veda-text">{q.instructions}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [ListChecks, `${q.questionCount}`, 'Questions'],
            [Clock, q.timeLimitMin ? `${q.timeLimitMin} min` : 'None', 'Time limit'],
            [Target, `${q.passPercent}%`, 'To pass'],
            [Repeat, q.maxAttempts ? `${q.attemptsLeft}/${q.maxAttempts}` : '∞', 'Attempts left'],
          ].map(([Icon, value, name], i) => {
            const I = Icon as typeof Clock;
            return (
              <div key={name as string} style={{ animationDelay: `${i * 70}ms` }} className="aq-rise rounded-2xl bg-white/70 p-3.5 ring-1 ring-gold/20">
                <I size={18} className="text-saffron" aria-hidden />
                <p className="mt-1.5 font-display text-[1.35rem] font-bold leading-none text-veda-bark">{value as string}</p>
                <p className="mt-1 text-[0.74rem] text-veda-muted">{name as string}</p>
              </div>
            );
          })}
        </div>

        <ul className="mt-5 space-y-1.5 text-[0.86rem] text-veda-text">
          {q.timeLimitMin > 0 && (
            <li className="flex gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-saffron" aria-hidden /> The timer starts when you press Start and keeps running even if you leave. The quiz is submitted automatically when time ends.
            </li>
          )}
          <li className="flex gap-2">
            <Wifi size={15} className="mt-0.5 shrink-0 text-saffron" aria-hidden /> Every answer is saved as you go, so a weak connection will not lose your work.
          </li>
          {q.availableUntil && (
            <li className="flex gap-2">
              <CalendarClock size={15} className="mt-0.5 shrink-0 text-saffron" aria-hidden /> Closes on {formatWhen(q.availableUntil)}.
            </li>
          )}
        </ul>

        <div className="mt-6">
          {blocked ? (
            <p className="inline-flex items-center gap-2 rounded-xl bg-cream px-4 py-2.5 text-sm font-semibold text-veda-muted">
              <Lock size={15} aria-hidden /> {blocked}
            </p>
          ) : (
            <button type="button" onClick={start} disabled={starting} className="btn-primary aq-shine !px-7 !py-3 !text-[0.95rem]">
              {starting ? <Loader2 size={17} className="animate-spin" aria-hidden /> : null} {label} <ArrowRight size={16} aria-hidden />
            </button>
          )}
          {startError && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {startError}
            </p>
          )}
        </div>
      </section>

      {data.attempts.length > 0 && (
        <section aria-labelledby="past">
          <h2 id="past" className="mb-3 font-display text-[1.35rem] font-bold text-veda-bark">
            Your attempts
          </h2>
          <div className="space-y-2.5">
            {[...data.attempts].reverse().map((a, i) => (
              <Link key={a.id} to={`${ASSESS_BASE}/attempt/${a.id}`} style={{ animationDelay: `${i * 60}ms` }} className={`${CARD} aq-rise flex items-center gap-4 p-3.5 transition hover:-translate-y-0.5 hover:border-gold/60`}>
                <ScoreRing percent={a.percent} size={56} stroke={6} tone={a.passed ? 'stroke-[#2e9b3e]' : 'stroke-saffron'} delay={200 + i * 60} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-veda-bark">
                    Attempt {a.attemptNo} · {a.passed ? 'Passed' : 'Not passed'}
                    {a.timedOut && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-amber-800">Time up</span>}
                  </p>
                  <p className="text-xs text-veda-muted">
                    {a.score}/{a.total} marks · {formatDuration(a.timeTakenSec)} · {when.format(new Date(a.submittedAt))}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-veda-brown">
                  Review <ArrowRight size={14} aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}