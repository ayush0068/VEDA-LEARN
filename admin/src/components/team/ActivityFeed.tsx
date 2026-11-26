import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, Spinner, btnSecondary, inputClass } from '@/components/common/ui';
import { activityIcon, dayHeading, dayKeyOf, deviceOf, fullTime, moduleLabel, OUTCOME_STYLE, timeOf } from '@/components/team/teamUtils';
import { useDebounced } from '@/hooks/useDebounced';
import { listActivity } from '@/services/team.service';
import type { ActivityFilters, ActivityItem, Member, Outcome, TeamOptions } from '@/types/team';

interface Props {
  options: TeamOptions | null;
  /** all admins, for the "Admin" filter (not needed when one admin is fixed) */
  members?: Member[];
  /** show only this admin */
  fixedAdmin?: string;
  initial?: ActivityFilters;
  /** change this to reload */
  refreshKey?: number;
  pageSize?: number;
}

const OUTCOME_TEXT: Record<Outcome, string> = { success: 'Done', denied: 'Blocked', failed: 'Failed' };

export default function ActivityFeed({ options, members, fixedAdmin, initial, refreshKey = 0, pageSize = 20 }: Props) {
  const [q, setQ] = useState(initial?.q ?? '');
  const [admin, setAdmin] = useState(initial?.admin ?? '');
  const [module, setModule] = useState(initial?.module ?? '');
  const [outcome, setOutcome] = useState<Outcome | ''>(initial?.outcome ?? '');
  const [type, setType] = useState<'auth' | 'change' | ''>(initial?.type ?? '');
  const [from, setFrom] = useState(initial?.from ?? '');
  const [to, setTo] = useState(initial?.to ?? '');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo<ActivityFilters>(() => ({ admin: fixedAdmin || admin, module, outcome, type, q: search.trim(), from, to }), [fixedAdmin, admin, module, outcome, type, search, from, to]);

  // any filter change starts again from page 1
  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listActivity(filters, page, pageSize)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setMeta({ page: res.pagination.page, pages: res.pagination.pages, total: res.pagination.total });
      })
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the activity'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, page, pageSize, refreshKey]);

  const moduleOptions = [...(options?.modules.map((m) => m.key) ?? []), 'team', 'auth'];
  const hasFilters = Boolean(q || admin || module || outcome || type || from || to);
  const reset = () => {
    setQ('');
    setAdmin('');
    setModule('');
    setOutcome('');
    setType('');
    setFrom('');
    setTo('');
  };

  // group the rows under "Today", "Yesterday", "Mon, 17 Nov"...
  const groups: { key: string; heading: string; rows: ActivityItem[] }[] = [];
  items.forEach((row) => {
    const key = dayKeyOf(row.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(row);
    else groups.push({ key, heading: dayHeading(row.createdAt), rows: [row] });
  });

  const select = `${inputClass} !py-2 !text-[0.82rem]`;

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search what was done, or a name…" aria-label="Search activity" className={`${inputClass} !pl-10`} />
        </div>
        {!fixedAdmin && (
          <select value={admin} onChange={(e) => setAdmin(e.target.value)} aria-label="Admin" className={select}>
            <option value="">All admins</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <select value={module} onChange={(e) => setModule(e.target.value)} aria-label="Section" className={select}>
          <option value="">All sections</option>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>
              {moduleLabel(options?.modules, m)}
            </option>
          ))}
        </select>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome | '')} aria-label="Result" className={select}>
          <option value="">Any result</option>
          <option value="success">Done</option>
          <option value="denied">Blocked (no permission)</option>
          <option value="failed">Failed</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as 'auth' | 'change' | '')} aria-label="Kind" className={select}>
          <option value="">Changes and sign-ins</option>
          <option value="change">Changes only</option>
          <option value="auth">Sign-ins only</option>
        </select>
        <label className="flex items-center gap-2 text-[0.76rem] text-veda-muted">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={`${select} min-w-0 flex-1`} />
        </label>
        <label className="flex items-center gap-2 text-[0.76rem] text-veda-muted">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`${select} min-w-0 flex-1`} />
        </label>
      </div>

      <div className="mt-2 flex items-center justify-between text-[0.76rem] text-veda-muted">
        <span>{loading ? 'Loading…' : `${new Intl.NumberFormat('en-IN').format(meta.total)} record${meta.total === 1 ? '' : 's'}`}</span>
        {hasFilters && (
          <button type="button" onClick={reset} className="font-semibold text-saffron hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.84rem] text-red-700">
          {error}
        </p>
      ) : loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-veda-muted">
          <Spinner /> Loading activity…
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-[0.88rem] text-veda-muted">{hasFilters ? 'Nothing matches these filters.' : 'No activity recorded yet. Every change an admin makes will appear here.'}</p>
      ) : (
        <div className={`mt-2 space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {groups.map((g) => (
            <section key={g.key}>
              <h3 className="sticky top-0 z-[1] bg-ivory/95 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-veda-muted backdrop-blur">{g.heading}</h3>
              <ul className="divide-y divide-line/60 rounded-xl border border-line bg-white/60">
                {g.rows.map((row) => {
                  const Icon = activityIcon(row);
                  const device = deviceOf(row.userAgent);
                  return (
                    <li key={row.id} className="flex gap-3 px-3 py-2.5">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${OUTCOME_STYLE[row.outcome]}`}>
                        <Icon size={15} strokeWidth={1.9} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[0.86rem] font-medium leading-snug text-veda-bark">{row.summary}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.74rem] text-veda-muted">
                          {!fixedAdmin && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-veda-bark/80">
                              <Avatar name={row.adminName} className="h-4 w-4 text-[0.5rem]" />
                              {row.adminName}
                            </span>
                          )}
                          <span>{moduleLabel(options?.modules, row.module)}</span>
                          {row.outcome !== 'success' && <span className={`rounded px-1.5 py-px font-semibold ${OUTCOME_STYLE[row.outcome]}`}>{OUTCOME_TEXT[row.outcome]}</span>}
                          {(device || row.ip) && <span className="truncate">{[device, row.ip].filter(Boolean).join(' · ')}</span>}
                        </p>
                      </div>
                      <time dateTime={row.createdAt} title={fullTime(row.createdAt)} className="shrink-0 pt-0.5 text-[0.74rem] text-veda-muted">
                        {timeOf(row.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1 || loading} className={btnSecondary}>
            <ChevronLeft size={16} aria-hidden /> Newer
          </button>
          <span className="text-[0.8rem] text-veda-muted">
            Page {meta.page} of {meta.pages}
          </span>
          <button type="button" onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={meta.page >= meta.pages || loading} className={btnSecondary}>
            Older <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}