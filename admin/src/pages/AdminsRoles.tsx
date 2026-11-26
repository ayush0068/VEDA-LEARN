import { Ban, Eye, KeyRound, LogOut, Pencil, Plus, Search, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import ShareCredentialsModal from '@/components/common/ShareCredentialsModal';
import type { ShareView } from '@/components/common/ShareCredentialsModal';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import ActivityFeed from '@/components/team/ActivityFeed';
import MemberCard from '@/components/team/MemberCard';
import MemberDrawer from '@/components/team/MemberDrawer';
import type { DrawerTab } from '@/components/team/MemberDrawer';
import MemberFormModal from '@/components/team/MemberFormModal';
import OverviewTab from '@/components/team/OverviewTab';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import type { MenuItem } from '@/components/students/RowMenu';
import { useToast } from '@/context/ToastContext';
import { useDebounced } from '@/hooks/useDebounced';
import { emailMemberCredentials, getTeamOptions, getTeamOverview, listTeam, removeMember, resetMemberPassword, signOutMember, updateMember } from '@/services/team.service';
import type { ActivityFilters, Member, MemberStatus, TeamOptions, TeamOverview } from '@/types/team';

type Tab = 'overview' | 'team' | 'activity';
type Confirm = { kind: 'reset' | 'suspend' | 'activate' | 'signout' | 'remove'; member: Member };

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'team', label: 'Team' },
  { key: 'activity', label: 'Activity log' },
];

const adminLoginLink = `${window.location.origin}/login`;

/** Super admin only: add admins, choose what each may do, and watch what they do. */
export default function AdminsRoles() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [options, setOptions] = useState<TeamOptions | null>(null);

  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [overviewError, setOverviewError] = useState('');
  const [members, setMembers] = useState<Member[] | null>(null);
  const [membersError, setMembersError] = useState('');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<MemberStatus | ''>('');
  const [preset, setPreset] = useState('');
  const [sort, setSort] = useState('newest');
  const search = useDebounced(q);

  const [form, setForm] = useState<{ member?: Member } | null>(null);
  const [drawer, setDrawer] = useState<{ id: string; tab: DrawerTab } | null>(null);
  const [version, setVersion] = useState(0); // bumped after any change so open views reload
  const [share, setShare] = useState<ShareView | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [feedFilters, setFeedFilters] = useState<ActivityFilters>({});
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    getTeamOptions().then(setOptions).catch(() => toast.error('Could not load the role options'));
  }, [toast]);

  const loadOverview = useCallback(() => {
    setOverviewError('');
    getTeamOverview()
      .then(setOverview)
      .catch((err: unknown) => setOverviewError(err instanceof Error ? err.message : 'Could not load the overview'));
  }, []);

  const loadMembers = useCallback(() => {
    setMembersError('');
    listTeam({ q: search.trim(), status, preset, sort })
      .then(setMembers)
      .catch((err: unknown) => setMembersError(err instanceof Error ? err.message : 'Could not load the team'));
  }, [search, status, preset, sort]);

  useEffect(loadOverview, [loadOverview, version]);
  useEffect(loadMembers, [loadMembers, version]);

  const changed = () => setVersion((v) => v + 1);

  const openActivity = (filters: ActivityFilters) => {
    setFeedFilters(filters);
    setFeedKey((k) => k + 1);
    setTab('activity');
  };

  const share_ = (member: Member, temporaryPassword: string, reason: ShareView['reason']) =>
    setShare({ person: { id: member.id, name: member.name, email: member.email, phone: member.phone }, temporaryPassword, reason });

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, member } = confirm;
    if (kind === 'reset') {
      const res = await resetMemberPassword(member.id);
      share_(res.admin, res.temporaryPassword, 'reset');
    } else if (kind === 'suspend' || kind === 'activate') {
      await updateMember(member.id, { isActive: kind === 'activate' });
      toast.success(kind === 'activate' ? `${member.name} can sign in again` : `${member.name} is suspended`);
    } else if (kind === 'signout') {
      await signOutMember(member.id);
      toast.success(`${member.name} was signed out on every device`);
    } else {
      await removeMember(member.id);
      toast.success(`${member.name} was removed`);
      setDrawer((d) => (d?.id === member.id ? null : d));
    }
    setConfirm(null);
    changed();
  };

  const menuFor = (m: Member): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'View performance', icon: Eye, onClick: () => setDrawer({ id: m.id, tab: 'performance' }) },
      { label: 'View activity', icon: Search, onClick: () => setDrawer({ id: m.id, tab: 'activity' }) },
    ];
    if (m.isSuper) return items;
    return [
      ...items,
      { label: 'Edit access', icon: Pencil, onClick: () => setForm({ member: m }) },
      { label: 'Reset password', icon: KeyRound, onClick: () => setConfirm({ kind: 'reset', member: m }) },
      { label: 'Sign out everywhere', icon: LogOut, onClick: () => setConfirm({ kind: 'signout', member: m }) },
      m.isActive ? { label: 'Suspend', icon: Ban, onClick: () => setConfirm({ kind: 'suspend', member: m }) } : { label: 'Activate', icon: UserCheck, onClick: () => setConfirm({ kind: 'activate', member: m }) },
      { label: 'Remove admin', icon: Trash2, danger: true, onClick: () => setConfirm({ kind: 'remove', member: m }) },
    ];
  };

  const feedMembers = useMemo(() => members ?? [], [members]);
  const hasFilters = Boolean(q || status || preset);
  const atLimit = Boolean(options && members && members.length >= options.maxAdmins);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">
            <ShieldCheck className="text-saffron" size={28} aria-hidden /> Admins &amp; Roles
          </h1>
          <p className="max-w-2xl text-[0.88rem] text-veda-muted">Add admins, choose exactly which sections each one may use, and keep an eye on what they do. Admins can reach nothing beyond the role you give them.</p>
        </div>
        <button type="button" onClick={() => setForm({})} disabled={!options || atLimit} className={`${btnPrimary} shrink-0`} title={atLimit ? 'Admin limit reached' : undefined}>
          <Plus size={17} aria-hidden /> Add admin
        </button>
      </header>

      <div role="tablist" aria-label="Admins and roles" className="flex gap-1 rounded-xl bg-cream p-1 sm:inline-flex">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`flex-1 rounded-lg px-4 py-2 text-[0.86rem] font-semibold transition sm:flex-none ${tab === t.key ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab data={overview} error={overviewError} options={options} onRetry={loadOverview} onOpenActivity={openActivity} onOpenMember={(id) => setDrawer({ id, tab: 'performance' })} />}

      {tab === 'team' && (
        <>
          <Card className="grid gap-2 p-3.5 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1fr_11rem_13rem_10rem]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or role…" aria-label="Search admins" className={`${inputClass} !pl-10`} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as MemberStatus | '')} aria-label="Status" className={inputClass}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="pending">Password pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Role" className={inputClass}>
              <option value="">Any role</option>
              {options?.presets.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={inputClass}>
              <option value="newest">Newest first</option>
              <option value="active">Recently active</option>
              <option value="name">Name A–Z</option>
            </select>
          </Card>

          {membersError ? (
            <Card className="p-6 text-center">
              <p role="alert" className="text-[0.9rem] text-red-700">{membersError}</p>
              <button type="button" onClick={loadMembers} className={`${btnSecondary} mt-3`}>Try again</button>
            </Card>
          ) : !members ? (
            <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted"><Spinner /> Loading team…</Card>
          ) : members.length === 0 ? (
            <Card className="p-10 text-center text-[0.9rem] text-veda-muted">{hasFilters ? 'No admin matches these filters.' : 'No admins yet.'}</Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {members.map((m) => (
                <MemberCard key={m.id} member={m} options={options} menu={menuFor(m)} onOpen={() => setDrawer({ id: m.id, tab: 'performance' })} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'activity' && (
        <Card className="p-3.5 sm:p-4">
          <ActivityFeed key={feedKey} options={options} members={feedMembers} initial={feedFilters} refreshKey={version} pageSize={20} />
        </Card>
      )}

      {form && options && (
        <MemberFormModal
          key={form.member?.id ?? 'new'}
          options={options}
          member={form.member}
          onClose={() => setForm(null)}
          onCreated={(res) => {
            setForm(null);
            share_(res.admin, res.temporaryPassword, 'created');
            changed();
          }}
          onUpdated={(m) => {
            setForm(null);
            toast.success(`${m.name}'s access was updated`);
            changed();
          }}
        />
      )}

      {drawer && (
        <MemberDrawer
          key={drawer.id + drawer.tab}
          id={drawer.id}
          options={options}
          initialTab={drawer.tab}
          version={version}
          onClose={() => setDrawer(null)}
          onEdit={(m) => setForm({ member: m })}
        />
      )}

      <ShareCredentialsModal view={share} noun="admin" emailConfigured={options?.emailConfigured ?? false} onEmail={emailMemberCredentials} onClose={() => setShare(null)} loginLink={adminLoginLink} doneLabel="Done" />

      <ConfirmDialog open={confirm?.kind === 'reset'} title="Reset password?" confirmLabel="Generate new password" onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>A new temporary password will be made for <b>{confirm?.member.name}</b>. They are signed out everywhere and must choose their own password at the next sign-in.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === 'suspend'} title="Suspend this admin?" confirmLabel="Suspend" danger onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p><b>{confirm?.member.name}</b> will be signed out and cannot sign in until you activate the account again. Their role and history are kept.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === 'activate'} title="Activate this admin?" confirmLabel="Activate" onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p><b>{confirm?.member.name}</b> will be able to sign in again with their current role.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === 'signout'} title="Sign out everywhere?" confirmLabel="Sign out" onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p><b>{confirm?.member.name}</b> is signed out on every device. They can sign in again with their password.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === 'remove'} title="Remove this admin?" confirmLabel="Remove permanently" danger onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>The account of <b>{confirm?.member.name}</b> is deleted and they lose all access at once. Their activity history stays in the record book. If you only want to pause them, suspend instead.</p>
      </ConfirmDialog>
    </div>
  );
}