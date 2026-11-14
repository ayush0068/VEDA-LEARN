import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import { Avatar, Spinner, btnSecondary } from '@/components/common/ui';
import { getLiveClass } from '@/services/live.service';
import type { AdminLiveClass, LiveClassDetails } from '@/types/live';
import { formatSeconds, formatTimeOnly } from './liveUtils';

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export default function AttendanceDrawer({ target, onClose }: { target: AdminLiveClass | null; onClose: () => void }) {
  const [data, setData] = useState<LiveClassDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    setData(null);
    setError('');
    getLiveClass(target.id)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load the report'));
  }, [target]);

  if (!target) return null;

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Name', 'Email', 'Joined', 'Left', 'Time in class (min)', 'Times joined'], ...data.attendance.map((a) => [a.name, a.email, a.firstJoinedAt, a.lastLeftAt ?? '', Math.round(a.totalSeconds / 60), a.joins])];
    const blob = new Blob([`﻿${rows.map((r) => r.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${target.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal open variant="drawer" drawerWidth="max-w-[560px]" onClose={onClose} title="Attendance report" subtitle={target.title}>
      {error ? (
        <p className="text-[0.9rem] text-red-700">{error}</p>
      ) : !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-saffron" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {[
              ['Attended', data.attendance.length],
              ['Peak at once', data.peakStudents],
              ['Chat messages', data.messageCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-white/70 py-3">
                <p className="font-display text-[1.4rem] font-bold text-veda-bark">{value}</p>
                <p className="text-[0.72rem] text-veda-muted">{label}</p>
              </div>
            ))}
          </div>

          {data.polls.length > 0 && (
            <section>
              <h3 className="mb-2 text-[0.86rem] font-bold text-veda-bark">Polls</h3>
              <div className="space-y-2.5">
                {data.polls.map((p, i) => (
                  <div key={i} className="rounded-xl border border-line bg-white/70 p-3">
                    <p className="text-[0.86rem] font-semibold text-veda-bark">{p.question}</p>
                    {p.options.map((o) => (
                      <div key={o.text} className="mt-1.5">
                        <div className="flex justify-between text-[0.78rem] text-veda-text">
                          <span>{o.text}</span>
                          <span>{o.votes}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gold/15">
                          <div className="h-full rounded-full bg-saffron" style={{ width: `${p.total ? (o.votes / p.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[0.86rem] font-bold text-veda-bark">Students ({data.attendance.length})</h3>
              {data.attendance.length > 0 && (
                <button type="button" onClick={exportCsv} className={`${btnSecondary} !px-3 !py-1.5 !text-[0.78rem]`}>
                  <Download size={14} aria-hidden /> Export CSV
                </button>
              )}
            </div>
            {data.attendance.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line py-8 text-center text-[0.86rem] text-veda-muted">Nobody joined this class.</p>
            ) : (
              <ul className="divide-y divide-line/70 rounded-2xl border border-line bg-white/70">
                {data.attendance.map((a) => (
                  <li key={a.userId} className="flex items-center gap-3 px-3.5 py-2.5">
                    <Avatar name={a.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.88rem] font-semibold text-veda-bark">{a.name}</p>
                      <p className="truncate text-[0.74rem] text-veda-muted">{a.email}</p>
                    </div>
                    <div className="text-right text-[0.76rem] text-veda-muted">
                      <p className="font-semibold text-veda-bark">{formatSeconds(a.totalSeconds)}</p>
                      <p>
                        {formatTimeOnly(a.firstJoinedAt)}
                        {a.joins > 1 ? ` · ${a.joins}x` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}