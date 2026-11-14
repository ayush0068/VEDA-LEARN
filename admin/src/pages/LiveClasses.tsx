import { Ban, CalendarClock, CalendarX2, CheckCheck, ChevronLeft, ChevronRight, Plus, Radio, RefreshCw, Search, Video, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import AttendanceDrawer from '@/components/live/AttendanceDrawer';
import LiveCard from '@/components/live/LiveCard';
import type { LiveCardActions } from '@/components/live/LiveCard';
import LiveFormDrawer from '@/components/live/LiveFormDrawer';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useDebounced } from '@/hooks/useDebounced';
import { cancelLiveClass, deleteLiveClass, deleteRecording, getLiveOptions, listLiveClasses, studentJoinLink } from '@/services/live.service';
import type { AdminLiveClass, LiveList, LiveOptions, LiveStats, LiveTab } from '@/types/live';

const TABS: { value: LiveTab; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live now' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function LiveClasses() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<LiveTab>('upcoming');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 350);
  const [course, setCourse] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<(LiveList & { stats: LiveStats }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const [options, setOptions] = useState<LiveOptions | null>(null);

  const [editing, setEditing] = useState<'new' | AdminLiveClass | null>(null);
  const [cancelling, setCancelling] = useState<AdminLiveClass | null>(null);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState<AdminLiveClass | null>(null);
  const [removingRec, setRemovingRec] = useState<AdminLiveClass | null>(null);
  const [attendance, setAttendance] = useState<AdminLiveClass | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    getLiveOptions()
      .then(setOptions)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Could not load courses and teachers'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    listLiveClasses({ tab, q, course, page, limit: 8 })
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        if (result.pagination.page !== page) setPage(result.pagination.page);
      })
      .catch((err: unknown) => id === requestId.current && setError(err instanceof Error ? err.message : 'Could not load live classes'))
      .finally(() => id === requestId.current && setLoading(false));
  }, [tab, q, course, page, reloadKey]);

  // numbers of people in the rooms change all the time: refresh the list quietly while the page is open
  useEffect(() => {
    const t = window.setInterval(() => !document.hidden && reload(), 20000);
    return () => window.clearInterval(t);
  }, [reload]);

  const stats = data?.stats;
  const classes = data?.classes ?? [];
  const pagination = data?.pagination;
  const filtering = Boolean(q) || Boolean(course);
  const firstItem = pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const pickTab = (next: LiveTab) => {
    setTab(next);
    setPage(1);
  };

  const actions: LiveCardActions = {
    onStart: (c) => navigate(`/live-classes/${c.id}/room`),
    onEdit: (c) => setEditing(c),
    onCancel: (c) => {
      setReason('');
      setCancelling(c);
    },
    onDelete: (c) => setDeleting(c),
    onAttendance: (c) => setAttendance(c),
    onRemoveRecording: (c) => setRemovingRec(c),
    onCopy: (c) => {
      navigator.clipboard
        ?.writeText(studentJoinLink(c.id))
        .then(() => toast.success('Student link copied'))
        .catch(() => toast.error('Could not copy the link'));
    },
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">Live Classes</h1>
          <p className="text-[0.88rem] text-veda-muted">Schedule classes and teach live with built-in video and audio. Students join from their dashboard, no other app needed.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button type="button" onClick={reload} disabled={loading} aria-label="Refresh" className={`${btnSecondary} !px-3`}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
          </button>
          <button type="button" onClick={() => setEditing('new')} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <Plus size={17} aria-hidden /> Schedule Class
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Radio} label="Live now" value={stats?.live} selected={tab === 'live'} onClick={() => pickTab('live')} />
        <StatCard icon={CalendarClock} label="Upcoming" value={stats?.upcoming} selected={tab === 'upcoming'} onClick={() => pickTab('upcoming')} />
        <StatCard icon={CheckCheck} label="Completed" value={stats?.past} selected={tab === 'past'} onClick={() => pickTab('past')} />
        <StatCard icon={CalendarX2} label="Cancelled" value={stats?.cancelled} selected={tab === 'cancelled'} onClick={() => pickTab('cancelled')} />
      </div>

      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row">
          <div role="tablist" aria-label="Class status" className="flex gap-1 overflow-x-auto rounded-xl bg-cream p-1">
            {TABS.map((t) => (
              <button key={t.value} role="tab" aria-selected={tab === t.value} type="button" onClick={() => pickTab(t.value)} className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[0.82rem] font-semibold transition ${tab === t.value ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by class title…"
              aria-label="Search live classes"
              className={`${inputClass} pl-10 pr-9`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-veda-muted hover:bg-cream">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by course"
            className={`${inputClass} cursor-pointer lg:w-60`}
          >
            <option value="">All courses</option>
            {(options?.courses ?? []).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className={`mt-3 transition-opacity duration-200 ${loading && data ? 'opacity-60' : ''}`} aria-busy={loading}>
          {error && !data ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <Ban size={32} strokeWidth={1.4} className="text-saffron" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-veda-bark">Could not load live classes</p>
              <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{error}</p>
              <button type="button" onClick={reload} className={`${btnSecondary} mt-4`}>
                <RefreshCw size={15} aria-hidden /> Try again
              </button>
            </div>
          ) : !data ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-60 animate-pulse rounded-2xl bg-gold/10" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <Video size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-veda-bark">{filtering ? 'No classes match your search' : `No ${tab === 'live' ? 'live' : tab} classes`}</p>
              <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{filtering ? 'Try a different word or course.' : 'Schedule a class and it shows on the students’ dashboard.'}</p>
              {!filtering && tab !== 'cancelled' && (
                <button type="button" onClick={() => setEditing('new')} className={`${btnPrimary} mt-4`}>
                  <Plus size={16} aria-hidden /> Schedule Class
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {classes.map((c) => (
                <LiveCard key={c.id} item={c} actions={actions} />
              ))}
            </div>
          )}
        </div>

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

      <LiveFormDrawer
        target={editing}
        options={options}
        onClose={() => setEditing(null)}
        onSaved={(message) => {
          setEditing(null);
          toast.success(message);
          reload();
        }}
      />
      <AttendanceDrawer target={attendance} onClose={() => setAttendance(null)} />

      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this class?"
        confirmLabel="Cancel class"
        danger
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          if (!cancelling) return;
          await cancelLiveClass(cancelling.id, reason.trim());
          toast.success('Class cancelled');
          setCancelling(null);
          reload();
        }}
      >
        <p>
          <b>{cancelling?.title}</b> will show as cancelled and students can no longer join.
        </p>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Reason (optional, students see it)" aria-label="Reason" className={inputClass} />
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this class?"
        confirmLabel="Delete permanently"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteLiveClass(deleting.id);
          toast.success('Class deleted');
          setDeleting(null);
          reload();
        }}
      >
        <p>
          <b>{deleting?.title}</b> with its attendance, chat and recording will be removed permanently.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={removingRec !== null}
        title="Delete the recording?"
        confirmLabel="Delete recording"
        danger
        onClose={() => setRemovingRec(null)}
        onConfirm={async () => {
          if (!removingRec) return;
          await deleteRecording(removingRec.id);
          toast.success('Recording deleted');
          setRemovingRec(null);
          reload();
        }}
      >
        <p>The video file of <b>{removingRec?.title}</b> is removed from the server. Students can no longer watch it.</p>
      </ConfirmDialog>
    </div>
  );
}