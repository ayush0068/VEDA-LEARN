import { Clock, Crown, Mail, Pencil, Phone, ShieldAlert, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, Spinner, btnPrimary, btnSecondary } from '@/components/common/ui';
import Modal from '@/components/common/Modal';
import { formatMinutes } from '@/components/curriculum/curriculumUtils';
import ActivityFeed from '@/components/team/ActivityFeed';
import BarChart from '@/components/team/BarChart';
import { LEVEL_HELP, LEVEL_LABEL, LEVEL_STYLE, STATUS_STYLE, moduleLabel, shortDay } from '@/components/team/teamUtils';
import { getMember } from '@/services/team.service';
import { formatDate, timeAgo } from '@/utils/format';
import type { Member, MemberDetails, TeamOptions } from '@/types/team';

export type DrawerTab = 'performance' | 'access' | 'activity';

interface Props {
  id: string;
  options: TeamOptions | null;
  initialTab?: DrawerTab;
  /** bump to reload after something changed */
  version: number;
  onClose: () => void;
  onEdit: (member: Member) => void;
}

const TABS: { key: DrawerTab; label: string }[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'access', label: 'Access' },
  { key: 'activity', label: 'Activity' },
];

const ACTION_LABEL: Record<string, string> = {
  create: 'Added',
  update: 'Edited',
  delete: 'Deleted',
  reset_password: 'Password resets',
  email_credentials: 'Login e-mails',
  upload: 'Uploads',
  reorder: 'Reordered',
  duplicate: 'Duplicated',
  move: 'Moved',
  cancel: 'Cancelled',
  bulk_status: 'Status changes',
  recording_start: 'Recordings started',
  recording_save: 'Recordings saved',
  recording_delete: 'Recordings deleted',
  sign_out: 'Signed out',
};

const actionText = (key: string) => {
  const [noun, verb = ''] = key.split('.');
  const what = ACTION_LABEL[verb] ?? verb;
  return `${what} · ${noun.replace(/_/g, ' ')}`;
};

export default function MemberDrawer({ id, options, initialTab = 'performance', version, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [data, setData] = useState<MemberDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    getMember(id)
      .then((d) => !cancelled && setData(d))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load this admin'));
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const m = data?.admin;
  const status = m ? STATUS_STYLE[m.status] : null;

  return (
    <Modal open onClose={onClose} title={m?.name ?? 'Admin'} subtitle={m ? `${m.title} · ${m.email}` : undefined} variant="drawer" drawerWidth="max-w-[680px]">
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.85rem] text-red-700">
          {error}
        </p>
      ) : !data || !m || !status ? (
        <div className="flex items-center justify-center gap-2 py-16 text-veda-muted">
          <Spinner /> Loading…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/70 p-3.5">
            <Avatar name={m.name} src={m.avatar} className="h-14 w-14 text-[1rem]" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-display text-[1.1rem] font-bold text-veda-bark">
                <span className="truncate">{m.name}</span>
                {m.isSuper && <Crown size={16} className="shrink-0 text-gold" aria-label="Super admin" />}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.76rem] text-veda-muted">
                <span className="inline-flex items-center gap-1"><Mail size={13} aria-hidden /> {m.email}</span>
                {m.phone && <span className="inline-flex items-center gap-1"><Phone size={13} aria-hidden /> {m.phone}</span>}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.72rem]">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${status.box}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
                  {status.label}
                </span>
                <span className={`rounded-md px-2 py-0.5 font-semibold ${m.online ? 'bg-[#E4F4DC] text-ok' : 'bg-cream text-veda-muted'}`}>{m.online ? 'Online now' : `Last active ${timeAgo(m.lastActiveAt)}`}</span>
              </p>
            </div>
            {!m.isSuper && (
              <button type="button" onClick={() => onEdit(m)} className={btnSecondary}>
                <Pencil size={15} aria-hidden /> Edit access
              </button>
            )}
          </div>

          <div role="tablist" aria-label="Admin details" className="flex gap-1 rounded-xl bg-cream p-1">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`flex-1 rounded-lg px-3 py-2 text-[0.84rem] font-semibold transition ${tab === t.key ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'performance' && <Performance data={data} options={options} />}
          {tab === 'access' && <Access member={m} options={options} onEdit={() => onEdit(m)} />}
          {tab === 'activity' && <ActivityFeed options={options} fixedAdmin={m.id} refreshKey={version} pageSize={20} />}
        </div>
      )}
    </Modal>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-line bg-white/70 px-3 py-2.5">
      <p className={`font-display text-[1.35rem] font-bold leading-none ${tone === 'warn' && Number(value) > 0 ? 'text-[#B3402A]' : 'text-veda-bark'}`}>{value}</p>
      <p className="mt-1 text-[0.76rem] leading-tight text-veda-bark/90">{label}</p>
      {hint && <p className="text-[0.68rem] leading-tight text-veda-muted">{hint}</p>}
    </div>
  );
}

function Performance({ data, options }: { data: MemberDetails; options: TeamOptions | null }) {
  const { stats, admin: m } = data;
  const maxHour = Math.max(1, ...data.hours.map((h) => h.count));
  const maxModule = Math.max(1, ...data.modules.map((x) => x.count));
  const busiest = data.hours.reduce((best, h) => (h.count > best.count ? h : best), data.hours[0]);
  const hourName = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? ' am' : ' pm'}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Tile label="Changes made" value={stats.actions30d} hint={`last 30 days · ${stats.actionsAllTime} in total`} />
        <Tile label="Active days" value={`${stats.activeDays30d}/30`} hint="days they used the panel" />
        <Tile label="Active time" value={formatMinutes(stats.activeMin30d)} hint="last 30 days" />
        <Tile label="Sign-ins" value={stats.logins30d} hint={m.lastLoginAt ? `last ${timeAgo(m.lastLoginAt)}` : 'never signed in'} />
        <Tile label="Blocked attempts" value={stats.denied30d} hint="tried something not allowed" tone="warn" />
        <Tile label="Wrong passwords" value={stats.failedLogins30d} hint="failed sign-ins" tone="warn" />
      </div>

      <section className="rounded-2xl border border-line bg-white/70 p-3.5">
        <h3 className="mb-3 flex items-center gap-2 text-[0.9rem] font-bold text-veda-bark"><Clock size={16} className="text-saffron" aria-hidden /> Changes per day · last 30 days</h3>
        <BarChart
          labelEvery={5}
          emptyText="No changes made in the last 30 days"
          data={data.days.map((d) => ({ key: d.date, label: shortDay(d.date), value: d.actions, tip: `${shortDay(d.date)}: ${d.actions} change${d.actions === 1 ? '' : 's'}, ${formatMinutes(d.activeMin)} active` }))}
        />
      </section>

      <section className="rounded-2xl border border-line bg-white/70 p-3.5">
        <h3 className="mb-1 text-[0.9rem] font-bold text-veda-bark">When they work</h3>
        <p className="mb-2.5 text-[0.76rem] text-veda-muted">{busiest.count > 0 ? `Busiest around ${hourName(busiest.hour)} (India time).` : 'Not enough activity yet.'}</p>
        <div className="grid grid-cols-12 gap-1 sm:grid-cols-[repeat(24,minmax(0,1fr))]">
          {data.hours.map((h) => (
            <div key={h.hour} title={`${hourName(h.hour)}: ${h.count} action${h.count === 1 ? '' : 's'}`} className="aspect-square rounded-[4px] bg-saffron" style={{ opacity: h.count ? 0.18 + 0.82 * (h.count / maxHour) : 0.07 }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.64rem] text-veda-muted" aria-hidden>
          <span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white/70 p-3.5">
          <h3 className="mb-2.5 text-[0.9rem] font-bold text-veda-bark">Where they work</h3>
          {data.modules.length === 0 ? (
            <p className="text-[0.82rem] text-veda-muted">No changes yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.modules.map((x) => (
                <li key={x.module}>
                  <div className="flex justify-between text-[0.8rem]"><span className="font-semibold text-veda-bark">{moduleLabel(options?.modules, x.module)}</span><span className="text-veda-muted">{x.count}</span></div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-gold" style={{ width: `${(x.count / maxModule) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-white/70 p-3.5">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[0.9rem] font-bold text-veda-bark"><Trophy size={15} className="text-saffron" aria-hidden /> What they do most</h3>
          {data.topActions.length === 0 ? (
            <p className="text-[0.82rem] text-veda-muted">No changes yet.</p>
          ) : (
            <ul className="space-y-1.5 text-[0.82rem]">
              {data.topActions.map((a) => (
                <li key={a.action} className="flex justify-between gap-2"><span className="truncate capitalize text-veda-bark">{actionText(a.action)}</span><span className="shrink-0 font-semibold text-veda-muted">{a.count}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {(stats.denied30d > 0 || stats.failedLogins30d > 0) && (
        <p className="flex gap-2 rounded-xl border border-[#F0C7BE] bg-[#FDF1EE] px-3 py-2.5 text-[0.8rem] leading-snug text-[#8F3320]">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>This admin tried things they are not allowed to do, or typed a wrong password. Open the Activity tab and filter by “Blocked” to see exactly what.</span>
        </p>
      )}
      <p className="text-center text-[0.74rem] text-veda-muted">Added {formatDate(m.createdAt)}{m.createdByName ? ` by ${m.createdByName}` : ''}</p>
    </div>
  );
}

function Access({ member: m, options, onEdit }: { member: Member; options: TeamOptions | null; onEdit: () => void }) {
  const modules = options?.modules ?? [];
  return (
    <div className="space-y-3">
      {m.isSuper ? (
        <p className="rounded-xl border border-line bg-[#FBF3DD] px-3.5 py-3 text-[0.84rem] leading-snug text-[#7A5200]">The super admin can use every section and is the only one who can add or remove admins. This account cannot be changed from here.</p>
      ) : (
        <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white/70">
          {modules.map((mod) => {
            const level = m.permissions[mod.key];
            return (
              <li key={mod.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0"><p className="text-[0.88rem] font-semibold text-veda-bark">{mod.label}</p><p className="text-[0.74rem] text-veda-muted">{LEVEL_HELP[level]}</p></div>
                <span className={`shrink-0 rounded-md px-2.5 py-1 text-[0.74rem] font-semibold ${LEVEL_STYLE[level]}`}>{LEVEL_LABEL[level]}</span>
              </li>
            );
          })}
        </ul>
      )}
      {!m.isSuper && <button type="button" onClick={onEdit} className={`${btnPrimary} w-full sm:w-auto`}><Pencil size={15} aria-hidden /> Change access</button>}
    </div>
  );
}