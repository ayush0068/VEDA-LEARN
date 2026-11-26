import { Activity, ShieldAlert, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader } from '@/components/common/Card';
import { Avatar, Spinner, btnSecondary } from '@/components/common/ui';
import StatCard from '@/components/common/StatCard';
import { formatMinutes } from '@/components/curriculum/curriculumUtils';
import BarChart from '@/components/team/BarChart';
import { activityIcon, moduleLabel, OUTCOME_STYLE, shortDay } from '@/components/team/teamUtils';
import { timeAgo } from '@/utils/format';
import type { ActivityFilters, TeamOptions, TeamOverview } from '@/types/team';

interface Props {
  data: TeamOverview | null;
  error: string;
  options: TeamOptions | null;
  onRetry: () => void;
  onOpenActivity: (filters: ActivityFilters) => void;
  onOpenMember: (id: string) => void;
}

export default function OverviewTab({ data, error, options, onRetry, onOpenActivity, onOpenMember }: Props) {
  const [metric, setMetric] = useState<'actions' | 'activeMin'>('actions');

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p role="alert" className="text-[0.9rem] text-red-700">
          {error}
        </p>
        <button type="button" onClick={onRetry} className={`${btnSecondary} mt-3`}>
          Try again
        </button>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
        <Spinner /> Loading overview…
      </Card>
    );
  }

  const { stats } = data;
  const topMax = Math.max(1, ...data.top.map((t) => t.actions));

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Users} label="Admins" value={stats.total} hint={`${stats.active} active · ${stats.pending} pending · ${stats.suspended} suspended`} />
        <StatCard icon={UserCheck} label="Online now" value={stats.online} hint="seen in the last 5 minutes" />
        <StatCard icon={Activity} label="Changes today" value={stats.actionsToday} hint={`${stats.actions7d} in the last 7 days`} />
        <StatCard icon={ShieldAlert} label="Blocked attempts" value={stats.denied7d} hint="last 7 days" onClick={() => onOpenActivity({ outcome: 'denied' })} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3 sm:gap-4">
        <Card className="p-4 lg:col-span-2">
          <CardHeader
            icon={Activity}
            title="Team activity · last 14 days"
            action={
              <div role="group" aria-label="Chart shows" className="flex rounded-lg bg-cream p-0.5 text-[0.72rem] font-semibold">
                {(['actions', 'activeMin'] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)} className={`rounded-md px-2.5 py-1 ${metric === k ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted'}`}>
                    {k === 'actions' ? 'Changes' : 'Active time'}
                  </button>
                ))}
              </div>
            }
          />
          <div className="mt-4">
            <BarChart
              labelEvery={2}
              emptyText="No admin activity in the last 14 days"
              data={data.days.map((d) => ({
                key: d.date,
                label: shortDay(d.date),
                value: d[metric],
                tip: `${shortDay(d.date)}: ${d.actions} change${d.actions === 1 ? '' : 's'}, ${formatMinutes(d.activeMin)} active${d.admins ? `, ${d.admins} admin${d.admins === 1 ? '' : 's'}` : ''}`,
              }))}
            />
          </div>
        </Card>

        <Card className="p-4">
          <CardHeader icon={UserCheck} title="Online now" />
          {data.online.length === 0 ? (
            <p className="mt-4 text-[0.84rem] text-veda-muted">Nobody is using the panel right now.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data.online.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpenMember(o.id)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-cream">
                    <Avatar name={o.name} className="h-8 w-8 text-[0.7rem]" />
                    <span className="min-w-0 flex-1 truncate text-[0.86rem] font-semibold text-veda-bark">{o.name}</span>
                    <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2 sm:gap-4">
        <Card className="p-4">
          <CardHeader icon={Users} title="Most active this week" />
          {data.top.length === 0 ? (
            <p className="mt-4 text-[0.84rem] text-veda-muted">No changes made in the last 7 days.</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {data.top.map((t, i) => (
                <li key={t.id}>
                  <button type="button" onClick={() => onOpenMember(t.id)} className="block w-full text-left">
                    <span className="flex items-center justify-between gap-2 text-[0.84rem]">
                      <span className="truncate font-semibold text-veda-bark">
                        {i + 1}. {t.name}
                      </span>
                      <span className="shrink-0 text-veda-muted">{t.actions} changes</span>
                    </span>
                    <span className="mt-1 block h-2 rounded-full bg-cream">
                      <span className="block h-full rounded-full bg-gradient-to-r from-gold to-saffron" style={{ width: `${(t.actions / topMax) * 100}%` }} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-4">
          <CardHeader
            icon={ShieldAlert}
            title="Needs your attention"
            action={
              data.attention.length > 0 && (
                <button type="button" onClick={() => onOpenActivity({ outcome: 'denied' })} className="text-[0.78rem] font-semibold text-saffron hover:underline">
                  View all
                </button>
              )
            }
          />
          {data.attention.length === 0 ? (
            <p className="mt-4 text-[0.84rem] text-veda-muted">No blocked attempts or wrong passwords in the last 7 days. 🙏</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.attention.map((a) => {
                const Icon = activityIcon(a);
                return (
                  <li key={a.id} className="flex gap-2.5 rounded-lg border border-line/70 bg-white/60 px-2.5 py-2">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${OUTCOME_STYLE[a.outcome]}`}>
                      <Icon size={14} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-[0.82rem] leading-snug text-veda-bark">{a.summary}</p>
                      <p className="text-[0.72rem] text-veda-muted">
                        {a.adminName} · {moduleLabel(options?.modules, a.module)} · {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}