import { Ban, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Clock, GraduationCap, KeyRound, RefreshCw, Search, UserCheck, UserPlus, UserX, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import ShareCredentialsModal from '@/components/common/ShareCredentialsModal';
import type { ShareView } from '@/components/common/ShareCredentialsModal';
import StatCard from '@/components/common/StatCard';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import InstructorCard from '@/components/instructors/InstructorCard';
import InstructorDrawer from '@/components/instructors/InstructorDrawer';
import type { DrawerTab } from '@/components/instructors/InstructorDrawer';
import InstructorFormModal from '@/components/instructors/InstructorFormModal';
import type { InstructorFormValues } from '@/components/instructors/InstructorFormModal';
import WeeklyTimetable from '@/components/instructors/WeeklyTimetable';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useDebounced } from '@/hooks/useDebounced';
import { createInstructor, deleteInstructor, emailInstructorCredentials, getInstructorOptions, getScheduleOverview, listInstructors, resetInstructorPassword, updateInstructor } from '@/services/instructors.service';
import type { InstructorList } from '@/services/instructors.service';
import type { SortKey, StatusFilter } from '@/types';
import type { Instructor, InstructorOptions, InstructorRole, ScheduleEntry } from '@/types/instructor';
import { ROLE_LABEL } from '@/utils/schedule';

const PAGE_SIZE = 9;

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'last-login', label: 'Recently active' },
];

type Confirm = { kind: 'reset' | 'toggle' | 'delete'; instructor: Instructor } | null;
type View = 'instructors' | 'schedule';

export default function Instructors({ startWithAdd = false }: { startWithAdd?: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();

  // ---- view + list state ----
  const [view, setView] = useState<View>('instructors');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 350);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [role, setRole] = useState<InstructorRole | ''>('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<InstructorList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  // ---- form options (roles, permissions, courses...) ----
  const [options, setOptions] = useState<InstructorOptions | null>(null);

  // ---- weekly timetable ----
  const [entries, setEntries] = useState<ScheduleEntry[] | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState('');

  // ---- dialogs ----
  const [adding, setAdding] = useState(startWithAdd);
  const [share, setShare] = useState<ShareView | null>(null);
  const [drawer, setDrawer] = useState<{ instructor: Instructor; tab: DrawerTab } | null>(null);
  const [drawerVersion, setDrawerVersion] = useState(0);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    getInstructorOptions()
      .then(setOptions)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Could not load roles and courses'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');

    listInstructors({ q, status, role, sort, page, limit: PAGE_SIZE })
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        if (result.pagination.page !== page) setPage(result.pagination.page);
      })
      .catch((err: unknown) => {
        if (id === requestId.current) setError(err instanceof Error ? err.message : 'Could not load instructors');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [q, status, role, sort, page, reloadKey]);

  useEffect(() => {
    if (view !== 'schedule') return;
    let active = true;
    setEntriesLoading(true);
    setEntriesError('');
    getScheduleOverview()
      .then((list) => active && setEntries(list))
      .catch((err: unknown) => active && setEntriesError(err instanceof Error ? err.message : 'Could not load the schedule'))
      .finally(() => active && setEntriesLoading(false));
    return () => {
      active = false;
    };
  }, [view, reloadKey]);

  const instructors = data?.instructors ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;
  const filtering = Boolean(q) || status !== 'all' || Boolean(role);

  const pickStatus = (next: StatusFilter) => {
    setStatus((cur) => (cur === next ? 'all' : next));
    setPage(1);
    setView('instructors');
  };

  const clearFilters = () => {
    setStatus('all');
    setRole('');
    setSearch('');
    setPage(1);
  };

  // ---- actions ----
  const closeAdd = () => {
    setAdding(false);
    if (startWithAdd) navigate('/instructors', { replace: true });
  };

  const submitAdd = async (values: InstructorFormValues) => {
    const created = await createInstructor(values);
    closeAdd();
    setShare({ person: created.instructor, temporaryPassword: created.temporaryPassword, reason: 'created' });
    setView('instructors');
    setSort('newest');
    clearFilters();
    reload();
    toast.success(`${created.instructor.name} was added`);
  };

  const closeShare = () => {
    const finished = share;
    setShare(null);
    // right after creating an account the next job is giving the instructor their access and schedule
    if (finished?.reason === 'created') setDrawer({ instructor: finished.person as Instructor, tab: 'access' });
  };

  const openDrawer = (i: Instructor, tab: DrawerTab = 'profile') => setDrawer({ instructor: i, tab });

  const enable = async (i: Instructor) => {
    try {
      await updateInstructor(i.id, { isActive: true });
      toast.success(`${i.name} was enabled`);
      setDrawerVersion((v) => v + 1);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable the account');
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, instructor } = confirm;

    if (kind === 'reset') {
      const result = await resetInstructorPassword(instructor.id);
      setConfirm(null);
      setShare({ person: result.instructor, temporaryPassword: result.temporaryPassword, reason: 'reset' });
      setDrawerVersion((v) => v + 1);
    } else if (kind === 'toggle') {
      await updateInstructor(instructor.id, { isActive: false });
      setConfirm(null);
      toast.success(`${instructor.name} was disabled`);
      setDrawerVersion((v) => v + 1);
    } else {
      await deleteInstructor(instructor.id);
      setConfirm(null);
      setDrawer(null);
      toast.success(`${instructor.name} was deleted`);
    }
    reload();
  };

  const actions = {
    onManage: (i: Instructor) => openDrawer(i),
    onReset: (i: Instructor) => setConfirm({ kind: 'reset', instructor: i }),
    onToggle: (i: Instructor) => (i.isActive ? setConfirm({ kind: 'toggle', instructor: i }) : void enable(i)),
    onDelete: (i: Instructor) => setConfirm({ kind: 'delete', instructor: i }),
  };

  // from the timetable: open the instructor on the Schedule tab
  const openFromTimetable = (id: string) => {
    const known = instructors.find((i) => i.id === id);
    if (known) return openDrawer(known, 'schedule');
    const entry = entries?.find((e) => e.instructorId === id);
    if (!entry) return;
    // only name/avatar are known here; the drawer loads the rest itself
    openDrawer(
      {
        id,
        name: entry.name,
        email: '',
        phone: '',
        avatar: entry.avatar,
        isActive: true,
        mustChangePassword: false,
        lastLoginAt: null,
        createdAt: '',
        title: '',
        instructorRole: entry.instructorRole,
        expertise: [],
        courseCount: 0,
        sessionsPerWeek: 0,
        hoursPerWeek: 0,
        permissionCount: 0,
      },
      'schedule',
    );
  };

  const firstItem = pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* heading + the main action */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">Instructors</h1>
          <p className="text-[0.88rem] text-veda-muted">Create teacher accounts and decide their role, access, courses and weekly schedule.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button type="button" onClick={reload} disabled={loading} aria-label="Refresh" className={`${btnSecondary} !px-3`}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
          </button>
          <button type="button" onClick={() => setAdding(true)} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <UserPlus size={17} aria-hidden /> Add Instructor
          </button>
        </div>
      </header>

      {/* numbers (click one to filter the list) */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard icon={GraduationCap} label="Total instructors" value={stats?.total} selected={status === 'all' && view === 'instructors'} onClick={() => pickStatus('all')} />
        <StatCard icon={UserCheck} label="Active" value={stats?.active} selected={status === 'active'} onClick={() => pickStatus('active')} />
        <StatCard icon={KeyRound} label="Password pending" value={stats?.pending} hint="Not changed yet" selected={status === 'pending'} onClick={() => pickStatus('pending')} />
        <StatCard icon={UserX} label="Disabled" value={stats?.disabled} selected={status === 'disabled'} onClick={() => pickStatus('disabled')} />
        <StatCard icon={Clock} label="Weekly sessions" value={stats?.sessionsPerWeek} hint="Across all instructors" selected={view === 'schedule'} onClick={() => setView('schedule')} />
      </div>

      <Card className="p-3.5 sm:p-4">
        {/* view switch */}
        <div role="tablist" aria-label="Instructors view" className="mb-3 inline-flex rounded-xl border border-line bg-cream/70 p-1">
          {([
            ['instructors', 'Instructors', Users],
            ['schedule', 'Weekly schedule', CalendarDays],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[0.84rem] font-semibold transition ${view === key ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}
            >
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>

        {view === 'schedule' ? (
          <WeeklyTimetable entries={entries} loading={entriesLoading} error={entriesError} onRetry={reload} onOpen={openFromTimetable} />
        ) : (
          <>
            {/* search + filters */}
            <div className="flex flex-col gap-2.5 lg:flex-row">
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email, title or expertise…"
                  aria-label="Search instructors"
                  className={`${inputClass} pl-10 pr-9`}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-veda-muted hover:bg-cream hover:text-veda-bark">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:flex">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as InstructorRole | '');
                    setPage(1);
                  }}
                  aria-label="Filter by role"
                  className={`${inputClass} cursor-pointer lg:w-48`}
                >
                  <option value="">All roles</option>
                  {(Object.keys(ROLE_LABEL) as InstructorRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortKey);
                    setPage(1);
                  }}
                  aria-label="Sort instructors"
                  className={`${inputClass} cursor-pointer lg:w-44`}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtering && (
              <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-veda-muted">
                Showing
                {status !== 'all' && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">{status === 'pending' ? 'password pending' : status}</span>}
                {role && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">{ROLE_LABEL[role]}</span>}
                {q && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">“{q}”</span>}
                <button type="button" onClick={clearFilters} className="font-semibold text-saffron hover:underline">
                  Clear filters
                </button>
              </p>
            )}

            {/* cards */}
            <div className={`mt-3 transition-opacity duration-200 ${loading && data ? 'opacity-60' : 'opacity-100'}`} aria-busy={loading}>
              {error && !data ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <Ban size={32} strokeWidth={1.4} className="text-saffron" aria-hidden />
                  <p className="mt-3 font-display text-lg font-bold text-veda-bark">Could not load instructors</p>
                  <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{error}</p>
                  <button type="button" onClick={reload} className={`${btnSecondary} mt-4`}>
                    <RefreshCw size={15} aria-hidden /> Try again
                  </button>
                </div>
              ) : !data ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading instructors">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-52 animate-pulse rounded-2xl bg-gold/10" />
                  ))}
                </div>
              ) : instructors.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <GraduationCap size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
                  <p className="mt-3 font-display text-lg font-bold text-veda-bark">{filtering ? 'No instructors match your search' : 'No instructors yet'}</p>
                  <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{filtering ? 'Try a different name or filter.' : 'Add your first instructor, then give them access, courses and a weekly schedule.'}</p>
                  {!filtering && (
                    <button type="button" onClick={() => setAdding(true)} className={`${btnPrimary} mt-4`}>
                      <UserPlus size={16} aria-hidden /> Add Instructor
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {instructors.map((i) => (
                    <InstructorCard key={i.id} instructor={i} actions={actions} />
                  ))}
                </div>
              )}
            </div>

            {/* pagination */}
            {pagination && pagination.total > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3 text-[0.8rem] text-veda-muted">
                <p>
                  Showing <b className="text-veda-bark">{firstItem}–{lastItem}</b> of <b className="text-veda-bark">{pagination.total}</b>
                </p>
                <div className="flex items-center gap-2">
                  {loading && <Spinner className="h-4 w-4 text-saffron" />}
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1 || loading} aria-label="Previous page" className={`${btnSecondary} !p-2`}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-[5.5rem] text-center">
                    Page <b className="text-veda-bark">{pagination.page}</b> of {pagination.pages}
                  </span>
                  <button type="button" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages || loading} aria-label="Next page" className={`${btnSecondary} !p-2`}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* dialogs */}
      <InstructorDrawer
        instructor={drawer?.instructor ?? null}
        tab={drawer?.tab ?? 'profile'}
        options={options}
        version={drawerVersion}
        onClose={() => setDrawer(null)}
        onChanged={reload}
        onReset={actions.onReset}
        onToggle={actions.onToggle}
        onDelete={actions.onDelete}
      />
      <InstructorFormModal open={adding} options={options} onClose={closeAdd} onSubmit={submitAdd} />
      <ShareCredentialsModal
        view={share}
        noun="instructor"
        emailConfigured={data?.emailConfigured ?? false}
        onEmail={emailInstructorCredentials}
        onClose={closeShare}
        doneLabel={share?.reason === 'created' ? 'Done: set up access & schedule' : 'Done'}
      />

      <ConfirmDialog open={confirm?.kind === 'reset'} title="Reset password?" confirmLabel="Generate new password" onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>
          A new random password will be generated for <b>{confirm?.instructor.name}</b>. They are signed out everywhere and must choose a new password the next time they log in.
        </p>
      </ConfirmDialog>

      <ConfirmDialog open={confirm?.kind === 'toggle'} title="Disable this account?" confirmLabel="Disable account" danger onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>
          <b>{confirm?.instructor.name}</b> will not be able to sign in, and their sessions disappear from the weekly schedule until you enable the account again. Their settings are kept.
        </p>
      </ConfirmDialog>

      <ConfirmDialog open={confirm?.kind === 'delete'} title="Delete this instructor?" confirmLabel="Delete permanently" danger onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>
          <b>{confirm?.instructor.name}</b>, their access and their weekly schedule will be removed permanently. This cannot be undone.
        </p>
        <p className="flex items-start gap-2 text-[0.8rem] text-veda-muted">
          <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden /> If you only want to stop them teaching for a while, disable the account instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}