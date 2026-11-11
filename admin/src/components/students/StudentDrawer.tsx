import { Ban, CircleCheck, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import { Avatar, Spinner, btnSecondary } from '@/components/common/ui';
import { getStudent } from '@/services/students.service';
import type { Student, StudentDetails } from '@/types';
import { formatDate, rupees, timeAgo } from '@/utils/format';
import StatusPill from './StatusPill';

interface Props {
  student: Student | null;
  /** bump to re-load after the student was changed from inside the drawer */
  version: number;
  onClose: () => void;
  onEdit: (s: Student) => void;
  onReset: (s: Student) => void;
  onToggle: (s: Student) => void;
  onDelete: (s: Student) => void;
}

export default function StudentDrawer({ student, ...rest }: Props) {
  if (!student) return null;
  return <Body key={student.id} base={student} {...rest} />;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-veda-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.88rem] font-medium text-veda-bark">{value || '—'}</dd>
    </div>
  );
}

function Body({ base, version, onClose, onEdit, onReset, onToggle, onDelete }: Omit<Props, 'student'> & { base: Student }) {
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    getStudent(base.id)
      .then((d) => active && setDetails(d))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : 'Could not load the student'));
    return () => {
      active = false;
    };
  }, [base.id, version]);

  const s: Student = details ?? base;

  return (
    <Modal open onClose={onClose} variant="drawer" title="Student details" subtitle={s.studentId || undefined}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={s.name} src={s.avatar} className="h-16 w-16 text-xl" />
          <div className="min-w-0">
            <p className="truncate font-display text-[1.3rem] font-bold text-veda-bark">{s.name}</p>
            <p className="truncate text-[0.85rem] text-veda-muted">{s.email}</p>
            <div className="mt-1.5">
              <StatusPill student={s} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => onEdit(s)} className={`${btnSecondary} !px-3 !py-2 !text-[0.8rem]`}>
            <Pencil size={15} aria-hidden /> Edit
          </button>
          <button type="button" onClick={() => onReset(s)} className={`${btnSecondary} !px-3 !py-2 !text-[0.8rem]`}>
            <KeyRound size={15} aria-hidden /> Reset password
          </button>
          <button type="button" onClick={() => onToggle(s)} className={`${btnSecondary} !px-3 !py-2 !text-[0.8rem]`}>
            {s.isActive ? <Ban size={15} aria-hidden /> : <CircleCheck size={15} aria-hidden />}
            {s.isActive ? 'Disable' : 'Enable'}
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white/70 p-4">
          <Info label="Phone" value={s.phone} />
          <Info label="Location" value={details?.location ?? ''} />
          <Info label="Joined" value={formatDate(s.createdAt)} />
          <Info label="Last login" value={s.lastLoginAt ? timeAgo(s.lastLoginAt) : 'Never signed in'} />
        </dl>

        {!details && !error && (
          <div className="flex items-center gap-2 text-[0.85rem] text-veda-muted" role="status">
            <Spinner /> Loading learning details…
          </div>
        )}
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">{error}</p>}

        {details && (
          <>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {[
                ['Courses', String(details.enrollments.length)],
                ['Paid orders', String(details.orders.paid)],
                ['Spent', rupees(details.orders.spent)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-white/70 px-2 py-3">
                  <p className="font-display text-[1.15rem] font-bold text-veda-bark">{value}</p>
                  <p className="text-[0.72rem] text-veda-muted">{label}</p>
                </div>
              ))}
            </div>

            <section>
              <h3 className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">Enrolled courses</h3>
              {details.enrollments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-[0.84rem] text-veda-muted">Not enrolled in any course yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {details.enrollments.map((e) => {
                    const pct = Math.min(100, Math.round((e.completedLessons / Math.max(e.totalLessons, 1)) * 100));
                    return (
                      <li key={e.slug} className="rounded-xl border border-line bg-white/70 px-3.5 py-3">
                        <div className="flex items-center justify-between gap-3 text-[0.84rem]">
                          <span className="min-w-0 truncate font-semibold text-veda-bark">{e.title}</span>
                          <span className="shrink-0 text-veda-muted">{pct}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7DBC4]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={e.title}>
                          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-[0.72rem] text-veda-muted">
                          {e.completedLessons} of {e.totalLessons} lessons
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        <button type="button" onClick={() => onDelete(s)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-[0.84rem] font-semibold text-red-700 transition hover:bg-red-100">
          <Trash2 size={16} aria-hidden /> Delete student
        </button>
      </div>
    </Modal>
  );
}