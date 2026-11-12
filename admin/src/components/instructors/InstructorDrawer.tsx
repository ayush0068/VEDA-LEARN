import { BookOpen, CalendarDays, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { Avatar, Spinner } from '@/components/common/ui';
import StatusPill from '@/components/students/StatusPill';
import { useToast } from '@/context/ToastContext';
import { getInstructor, updateInstructor } from '@/services/instructors.service';
import type { InstructorPatch } from '@/services/instructors.service';
import type { Instructor, InstructorDetails, InstructorOptions } from '@/types/instructor';
import AccessTab from './AccessTab';
import CoursesTab from './CoursesTab';
import ProfileTab from './ProfileTab';
import RoleBadge from './RoleBadge';
import ScheduleTab from './ScheduleTab';

export type DrawerTab = 'profile' | 'access' | 'courses' | 'schedule';

interface Props {
  instructor: Instructor | null;
  tab: DrawerTab;
  options: InstructorOptions | null;
  /** bump to re-load after the instructor was changed outside the drawer (reset / enable / disable) */
  version: number;
  onClose: () => void;
  /** called after anything was saved, so the list behind refreshes */
  onChanged: () => void;
  onReset: (i: Instructor) => void;
  onToggle: (i: Instructor) => void;
  onDelete: (i: Instructor) => void;
}

export default function InstructorDrawer({ instructor, ...rest }: Props) {
  if (!instructor) return null;
  return <Body key={instructor.id} base={instructor} {...rest} />;
}

function Body({ base, tab: initialTab, options, version, onClose, onChanged, onReset, onToggle, onDelete }: Omit<Props, 'instructor'> & { base: Instructor }) {
  const toast = useToast();
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [details, setDetails] = useState<InstructorDetails | null>(null);
  const [error, setError] = useState('');
  // bumping a key re-creates that tab from the freshly saved data
  const [keys, setKeys] = useState({ profile: 0, access: 0, courses: 0, schedule: 0 });

  useEffect(() => {
    let active = true;
    setError('');
    getInstructor(base.id)
      .then((d) => {
        if (!active) return;
        setDetails(d);
        setKeys((k) => ({ ...k, profile: k.profile + 1 }));
      })
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : 'Could not load the instructor'));
    return () => {
      active = false;
    };
  }, [base.id, version]);

  const save = (resets: (keyof typeof keys)[]) => async (patch: InstructorPatch) => {
    const updated = await updateInstructor(base.id, patch);
    setDetails(updated);
    if (resets.length) setKeys((k) => ({ ...k, ...Object.fromEntries(resets.map((r) => [r, k[r] + 1])) }));
    toast.success('Saved');
    onChanged();
  };

  const view: Instructor = details ?? base;

  const tabs: { key: DrawerTab; label: string; icon: LucideIcon; count?: number }[] = [
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'access', label: 'Access', icon: ShieldCheck, count: details ? Object.values(details.permissions).filter(Boolean).length : undefined },
    { key: 'courses', label: 'Courses', icon: BookOpen, count: details?.courses.length },
    { key: 'schedule', label: 'Schedule', icon: CalendarDays, count: details?.schedule.length },
  ];

  return (
    <Modal open onClose={onClose} variant="drawer" drawerWidth="max-w-[640px]" title="Manage instructor" subtitle={view.email}>
      <div className="space-y-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={view.name} src={view.avatar} className="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-[1.25rem] font-bold leading-tight text-veda-bark">{view.name}</p>
            <p className="truncate text-[0.82rem] text-veda-muted">{view.title || 'No title yet'}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <RoleBadge role={view.instructorRole} />
              <StatusPill student={view} />
            </div>
          </div>
        </div>

        <div role="tablist" aria-label="Instructor settings" className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.84rem] font-semibold transition ${tab === key ? 'border-saffron text-saffron' : 'border-transparent text-veda-muted hover:text-veda-bark'}`}
            >
              <Icon size={16} aria-hidden />
              {label}
              {count !== undefined && <span className="rounded-full bg-peach px-1.5 text-[0.68rem] text-veda-bark">{count}</span>}
            </button>
          ))}
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">{error}</p>}

        {!details && !error && (
          <div className="flex items-center gap-2 py-6 text-[0.85rem] text-veda-muted" role="status">
            <Spinner /> Loading…
          </div>
        )}

        {details && !options && !error && (
          <div className="flex items-center gap-2 py-6 text-[0.85rem] text-veda-muted" role="status">
            <Spinner /> Loading roles and courses…
          </div>
        )}

        {/* every tab stays mounted (just hidden) so half-filled forms are kept while switching */}
        {details && options && (
          <>
            <div role="tabpanel" hidden={tab !== 'profile'}>
              <ProfileTab key={keys.profile} details={details} onSave={save([])} onReset={() => onReset(view)} onToggle={() => onToggle(view)} onDelete={() => onDelete(view)} />
            </div>
            <div role="tabpanel" hidden={tab !== 'access'}>
              <AccessTab key={keys.access} details={details} options={options} onSave={save([])} />
            </div>
            <div role="tabpanel" hidden={tab !== 'courses'}>
              <CoursesTab key={keys.courses} details={details} options={options} onSave={save(['schedule'])} />
            </div>
            <div role="tabpanel" hidden={tab !== 'schedule'}>
              <ScheduleTab key={keys.schedule} details={details} options={options} onSave={save([])} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}