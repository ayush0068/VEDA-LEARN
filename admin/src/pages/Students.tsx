import { Ban, ChevronLeft, ChevronRight, CircleCheck, RefreshCw, Search, UserCheck, UserPlus, Users, UserX, KeyRound, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import CredentialsModal from '@/components/students/CredentialsModal';
import type { CredentialsView } from '@/components/students/CredentialsModal';
import StudentDrawer from '@/components/students/StudentDrawer';
import StudentFormModal from '@/components/students/StudentFormModal';
import type { StudentFormValues } from '@/components/students/StudentFormModal';
import StudentsTable from '@/components/students/StudentsTable';
import { useToast } from '@/context/ToastContext';
import { useDebounced } from '@/hooks/useDebounced';
import { createStudent, deleteStudent, listStudents, resetStudentPassword, updateStudent } from '@/services/students.service';
import type { StudentList } from '@/services/students.service';
import type { SortKey, StatusFilter, Student } from '@/types';

const PAGE_SIZE = 10;

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'last-login', label: 'Recently active' },
];

type Confirm = { kind: 'reset' | 'toggle' | 'delete'; student: Student } | null;

function StatCard({ icon: Icon, label, value, hint, selected, onClick }: { icon: LucideIcon; label: string; value: number | undefined; hint?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left shadow-card transition duration-200 hover:-translate-y-0.5 ${
        selected ? 'border-gold bg-white ring-2 ring-gold/30' : 'border-line bg-card/90'
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach text-[#C77A2B]">
        <Icon size={21} strokeWidth={1.6} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[1.45rem] font-bold leading-none text-veda-bark">{value === undefined ? '–' : new Intl.NumberFormat('en-IN').format(value)}</span>
        <span className="mt-1 block text-[0.8rem] leading-tight text-veda-bark/90">{label}</span>
        {hint && <span className="block text-[0.7rem] leading-tight text-veda-muted">{hint}</span>}
      </span>
    </button>
  );
}

export default function Students({ startWithAdd = false }: { startWithAdd?: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();

  // ---- list state ----
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 350);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<StudentList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  // ---- dialogs ----
  const [formTarget, setFormTarget] = useState<Student | 'new' | null>(startWithAdd ? 'new' : null);
  const [credentials, setCredentials] = useState<CredentialsView | null>(null);
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [drawerVersion, setDrawerVersion] = useState(0);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');

    listStudents({ q, status, sort, page, limit: PAGE_SIZE })
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        // asked for a page that no longer exists (e.g. after deleting the last row of the last page)
        if (result.pagination.page !== page) setPage(result.pagination.page);
      })
      .catch((err: unknown) => {
        if (id === requestId.current) setError(err instanceof Error ? err.message : 'Could not load students');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [q, status, sort, page, reloadKey]);

  const students = data?.students ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;
  const filtering = Boolean(q) || status !== 'all';

  const pickStatus = (next: StatusFilter) => {
    setStatus((cur) => (cur === next ? 'all' : next));
    setPage(1);
  };

  // ---- actions ----
  const closeForm = () => {
    setFormTarget(null);
    if (startWithAdd) navigate('/students', { replace: true });
  };

  const submitForm = async (values: StudentFormValues) => {
    if (formTarget === 'new') {
      const created = await createStudent(values);
      setFormTarget(null);
      if (startWithAdd) navigate('/students', { replace: true });
      setCredentials({ ...created, reason: 'created' });
      setSort('newest');
      setStatus('all');
      setSearch('');
      setPage(1);
      reload();
      toast.success(`${created.student.name} was added`);
    } else if (formTarget) {
      await updateStudent(formTarget.id, { name: values.name, phone: values.phone });
      setFormTarget(null);
      setDrawerVersion((v) => v + 1);
      setDrawerStudent((cur) => (cur && cur.id === formTarget.id ? { ...cur, name: values.name, phone: values.phone } : cur));
      reload();
      toast.success('Student updated');
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, student } = confirm;

    if (kind === 'reset') {
      const result = await resetStudentPassword(student.id);
      setConfirm(null);
      setCredentials({ ...result, reason: 'reset' });
    } else if (kind === 'toggle') {
      await updateStudent(student.id, { isActive: !student.isActive });
      setConfirm(null);
      toast.success(student.isActive ? `${student.name} was disabled` : `${student.name} was enabled`);
      setDrawerStudent((cur) => (cur && cur.id === student.id ? { ...cur, isActive: !student.isActive } : cur));
      setDrawerVersion((v) => v + 1);
    } else {
      await deleteStudent(student.id);
      setConfirm(null);
      setDrawerStudent(null);
      toast.success(`${student.name} was deleted`);
    }
    reload();
  };

  // students from the drawer: close the drawer first so dialogs do not stack awkwardly
  const actions = {
    onView: (s: Student) => setDrawerStudent(s),
    onEdit: (s: Student) => setFormTarget(s),
    onReset: (s: Student) => setConfirm({ kind: 'reset', student: s }),
    onToggle: (s: Student) => (s.isActive ? setConfirm({ kind: 'toggle', student: s }) : void toggleDirect(s)),
    onDelete: (s: Student) => setConfirm({ kind: 'delete', student: s }),
  };

  // enabling is harmless, so no confirmation
  const toggleDirect = async (s: Student) => {
    try {
      await updateStudent(s.id, { isActive: true });
      toast.success(`${s.name} was enabled`);
      setDrawerStudent((cur) => (cur && cur.id === s.id ? { ...cur, isActive: true } : cur));
      setDrawerVersion((v) => v + 1);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable the account');
    }
  };

  const firstItem = pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* heading + the main action */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">Students</h1>
          <p className="text-[0.88rem] text-veda-muted">Add, manage and support the learners of VedaLearn.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button type="button" onClick={reload} disabled={loading} aria-label="Refresh" className={`${btnSecondary} !px-3`}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
          </button>
          <button type="button" onClick={() => setFormTarget('new')} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <UserPlus size={17} aria-hidden /> Add Student
          </button>
        </div>
      </header>

      {/* numbers (click one to filter the list) */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Users} label="Total students" value={stats?.total} hint={stats ? `+${stats.newThisMonth} this month` : undefined} selected={status === 'all'} onClick={() => pickStatus('all')} />
        <StatCard icon={UserCheck} label="Active" value={stats?.active} selected={status === 'active'} onClick={() => pickStatus('active')} />
        <StatCard icon={KeyRound} label="Password pending" value={stats?.pending} hint="Not changed yet" selected={status === 'pending'} onClick={() => pickStatus('pending')} />
        <StatCard icon={UserX} label="Disabled" value={stats?.disabled} selected={status === 'disabled'} onClick={() => pickStatus('disabled')} />
      </div>

      <Card className="p-3.5 sm:p-4">
        {/* search + sort */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, ID or phone…"
              aria-label="Search students"
              className={`${inputClass} pl-10 pr-9`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-veda-muted hover:bg-cream hover:text-veda-bark">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            aria-label="Sort students"
            className={`${inputClass} cursor-pointer sm:w-48`}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {filtering && (
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-veda-muted">
            Showing
            {status !== 'all' && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">{status === 'pending' ? 'password pending' : status}</span>}
            {q && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">“{q}”</span>}
            <button
              type="button"
              onClick={() => {
                setStatus('all');
                setSearch('');
                setPage(1);
              }}
              className="font-semibold text-saffron hover:underline"
            >
              Clear filters
            </button>
          </p>
        )}

        {/* list */}
        <div className={`mt-3 transition-opacity duration-200 ${loading && data ? 'opacity-60' : 'opacity-100'}`} aria-busy={loading}>
          {error && !data ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <Ban size={32} strokeWidth={1.4} className="text-saffron" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-veda-bark">Could not load students</p>
              <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{error}</p>
              <button type="button" onClick={reload} className={`${btnSecondary} mt-4`}>
                <RefreshCw size={15} aria-hidden /> Try again
              </button>
            </div>
          ) : !data ? (
            <div className="space-y-2.5 py-2" role="status" aria-label="Loading students">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl p-2">
                  <div className="h-10 w-10 rounded-full bg-gold/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 rounded bg-gold/20" />
                    <div className="h-3 w-1/2 rounded bg-gold/15" />
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <Users size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-veda-bark">{filtering ? 'No students match your search' : 'No students yet'}</p>
              <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{filtering ? 'Try a different name, email or filter.' : 'Add your first student. A secure password is generated for them automatically.'}</p>
              {!filtering && (
                <button type="button" onClick={() => setFormTarget('new')} className={`${btnPrimary} mt-4`}>
                  <UserPlus size={16} aria-hidden /> Add Student
                </button>
              )}
            </div>
          ) : (
            <StudentsTable students={students} actions={actions} />
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
      </Card>

      {/* dialogs */}
      <StudentDrawer student={drawerStudent} version={drawerVersion} onClose={() => setDrawerStudent(null)} {...actions} />
      <StudentFormModal target={formTarget} onClose={closeForm} onSubmit={submitForm} />
      <CredentialsModal credentials={credentials} emailConfigured={data?.emailConfigured ?? false} onClose={() => setCredentials(null)} />

      <ConfirmDialog
        open={confirm?.kind === 'reset'}
        title="Reset password?"
        confirmLabel="Generate new password"
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      >
        <p>
          A new random password will be generated for <b>{confirm?.student.name}</b>. They are signed out everywhere and must choose a new password the next time they log in.
        </p>
      </ConfirmDialog>

      <ConfirmDialog open={confirm?.kind === 'toggle'} title="Disable this account?" confirmLabel="Disable account" danger onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>
          <b>{confirm?.student.name}</b> will not be able to sign in until you enable the account again. Their data is kept.
        </p>
      </ConfirmDialog>

      <ConfirmDialog open={confirm?.kind === 'delete'} title="Delete this student?" confirmLabel="Delete permanently" danger onClose={() => setConfirm(null)} onConfirm={runConfirm}>
        <p>
          <b>{confirm?.student.name}</b> and their cart, progress and unpaid orders will be removed permanently. This cannot be undone.
        </p>
        <p className="flex items-start gap-2 text-[0.8rem] text-veda-muted">
          <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden /> Students with payment records cannot be deleted, so disable those instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}