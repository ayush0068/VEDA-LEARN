import { ArrowLeft, ChevronDown, Clock, Target, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { Spinner, btnSecondary } from '@/components/common/ui';
import { GrowBar, formatDuration } from '@/components/assessments/assessUtils';
import * as api from '@/services/assessments.service';
import type { AttemptRow, QuizAnalytics } from '@/types/assessments';
import { timeAgo } from '@/utils/format';

const rateTone = (rate: number) => (rate >= 70 ? 'bg-gradient-to-r from-[#2e9b3e] to-[#58b567]' : rate >= 40 ? 'bg-gradient-to-r from-gold to-saffron' : 'bg-gradient-to-r from-[#c0392b] to-[#e0654f]');

function AttemptTable({ rows, empty }: { rows: AttemptRow[]; empty: string }) {
  if (!rows.length) return <p className="py-6 text-center text-[0.85rem] text-veda-muted">{empty}</p>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[30rem] text-left text-[0.82rem]">
        <thead className="text-[0.7rem] uppercase tracking-wide text-veda-muted">
          <tr>
            <th className="px-1 py-2 font-semibold">Student</th>
            <th className="px-1 py-2 font-semibold">Score</th>
            <th className="px-1 py-2 font-semibold">Time</th>
            <th className="px-1 py-2 font-semibold">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-1 py-2">
                <span className="font-semibold text-veda-bark">{r.student}</span>
                <span className="block text-[0.72rem] text-veda-muted">Attempt {r.attemptNo}</span>
              </td>
              <td className="px-1 py-2">
                <span className={`rounded-full px-2 py-0.5 text-[0.72rem] font-bold ${r.passed ? 'bg-ok/15 text-ok' : 'bg-red-100 text-red-700'}`}>{r.percent}%</span>
                <span className="ml-2 text-veda-muted">
                  {r.score}/{r.total}
                </span>
              </td>
              <td className="px-1 py-2 text-veda-muted">{formatDuration(r.timeTakenSec)}</td>
              <td className="px-1 py-2 text-veda-muted">{timeAgo(r.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QuizResults() {
  const { id = '' } = useParams();
  const [data, setData] = useState<QuizAnalytics | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    api.getQuizAnalytics(id).then((d) => {
      setData(d);
      window.setTimeout(() => setOn(true), 40);
    }).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the results'));
  }, [id]);

  if (error)
    return (
      <Card className="p-8 text-center">
        <p role="alert" className="text-red-700">
          {error}
        </p>
        <Link to="/quizzes-assignments" className={`${btnSecondary} mt-4`}>
          Back
        </Link>
      </Card>
    );
  if (!data)
    return (
      <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
        <Spinner /> Loading results…
      </Card>
    );

  const { summary, distribution } = data;
  const peak = Math.max(1, ...distribution.map((d) => d.count));
  const hardest = [...data.questions].filter((q) => q.answered > 0).sort((a, b) => a.correctRate - b.correctRate)[0];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <Link to="/quizzes-assignments" className="inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-veda-muted hover:text-saffron">
        <ArrowLeft size={15} aria-hidden /> Quizzes &amp; Assignments
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">{data.quiz.title}</h1>
          <p className="text-[0.88rem] text-veda-muted">
            Results · {data.quiz.courseTitle} · pass mark {data.quiz.passPercent}%
          </p>
        </div>
        <Link to={`/quizzes-assignments/quiz/${id}`} className={btnSecondary}>
          Edit quiz
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Users} label="Students" value={summary.students} hint={`${summary.attempts} attempts`} />
        <StatCard icon={Target} label="Average score" value={summary.avgPercent} hint={`${summary.lowest}% – ${summary.highest}%`} />
        <StatCard icon={Trophy} label="Pass rate" value={summary.passRate} hint="of all attempts" />
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-card/90 p-3.5 shadow-card">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach text-[#C77A2B]">
            <Clock size={21} strokeWidth={1.6} aria-hidden />
          </span>
          <span>
            <span className="block font-display text-[1.45rem] font-bold leading-none text-veda-bark">{formatDuration(summary.avgTimeSec)}</span>
            <span className="mt-1 block text-[0.8rem] text-veda-bark/90">Average time</span>
          </span>
        </div>
      </div>

      {summary.attempts === 0 ? (
        <Card className="p-10 text-center text-[0.9rem] text-veda-muted">Nobody has taken this quiz yet. Results will appear here as soon as students submit.</Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <CardHeader icon={Target} title="Score spread" />
              <div className="mt-4 flex h-44 items-end gap-1.5" role="img" aria-label="Number of attempts in each score range">
                {distribution.map((d, i) => (
                  <div key={d.from} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[0.68rem] font-semibold text-veda-bark">{d.count || ''}</span>
                    <div
                      className={`w-full rounded-t-md transition-[height] duration-700 ease-out ${d.from >= data.quiz.passPercent ? 'bg-gradient-to-t from-[#2e9b3e] to-[#6cc17a]' : 'bg-gradient-to-t from-gold to-saffron'}`}
                      style={{ height: on ? `${(d.count / peak) * 100}%` : '0%', minHeight: d.count ? 4 : 2, transitionDelay: `${i * 50}ms`, opacity: d.count ? 1 : 0.25 }}
                    />
                    <span className="text-[0.62rem] text-veda-muted">{d.from}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[0.72rem] text-veda-muted">Score range (%) · green = passing</p>
            </Card>

            <Card className="p-4">
              <CardHeader icon={Trophy} title="Top scorers" />
              <AttemptTable rows={data.leaderboard.slice(0, 5)} empty="No scores yet" />
            </Card>
          </div>

          <Card className="p-4">
            <CardHeader icon={Target} title="Question by question" />
            {hardest && hardest.correctRate < 60 && (
              <p className="mt-3 rounded-xl bg-peach/70 px-3 py-2 text-[0.82rem] text-veda-bark">
                Hardest: <strong>Q{hardest.number}</strong> — only {hardest.correctRate}% got it right. Worth revisiting in class.
              </p>
            )}
            <ul className="mt-3 divide-y divide-line/60">
              {data.questions.map((q, i) => (
                <li key={q.id}>
                  <button type="button" onClick={() => setOpen(open === q.id ? null : q.id)} aria-expanded={open === q.id} className="flex w-full items-center gap-3 py-3 text-left">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-peach text-[0.82rem] font-bold text-saffron">{q.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.88rem] font-semibold text-veda-bark">{q.text}</span>
                      <GrowBar percent={q.correctRate} tone={rateTone(q.correctRate)} delay={i * 40} className="mt-1.5 h-1.5" />
                    </span>
                    <span className="w-12 shrink-0 text-right text-[0.85rem] font-bold text-veda-bark">{q.correctRate}%</span>
                    <ChevronDown size={16} className={`shrink-0 text-veda-muted transition-transform ${open === q.id ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                  {open === q.id && (
                    <div className="animate-fade-in space-y-1.5 pb-3 pl-11 pr-8">
                      <p className="text-[0.75rem] text-veda-muted">
                        {q.correct} correct · {q.answered - q.correct} wrong · {q.skipped} skipped
                      </p>
                      {q.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-2 text-[0.8rem]">
                          <span className={`w-4 text-center font-bold ${o.correct ? 'text-ok' : 'text-transparent'}`}>✓</span>
                          <span className="min-w-0 flex-1 truncate text-veda-text">{o.text}</span>
                          <span className="w-10 text-right text-veda-muted">{o.picked}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <CardHeader icon={Clock} title="Recent attempts" />
            <AttemptTable rows={data.recent} empty="No attempts" />
          </Card>
        </>
      )}
    </div>
  );
}