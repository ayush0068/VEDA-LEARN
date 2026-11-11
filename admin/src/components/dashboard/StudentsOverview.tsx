import { Users } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { STUDENT_SEGMENTS, STUDENT_TOTAL } from '@/data/dashboard';

const SIZE = 152;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 3; // px gap between segments

export default function StudentsOverview() {
  let offset = 0;

  return (
    <Card className="flex h-full flex-col p-4">
      <CardHeader icon={Users} title="Students Overview" />

      {/* @container: donut + legend sit side by side only when the card is wide enough, otherwise stacked */}
      <div className="@container mt-3.5 flex flex-1 items-center">
        <div className="mx-auto flex w-full flex-col items-center gap-5 @[440px]:flex-row @[440px]:justify-center">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" role="img" aria-label="Students by status">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#F3E3C6" strokeWidth={STROKE} />
            {STUDENT_SEGMENTS.map((seg) => {
              const length = (seg.percent / 100) * C;
              const el = (
                <circle
                  key={seg.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${Math.max(length - GAP, 0)} ${C}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[1.35rem] font-bold leading-none text-veda-bark">{new Intl.NumberFormat('en-IN').format(STUDENT_TOTAL)}</span>
            <span className="mt-1 text-[0.82rem] text-veda-bark/85">Total</span>
          </div>
        </div>

        <ul className="w-full max-w-[300px] space-y-3 text-[0.78rem] @[440px]:w-auto @[440px]:max-w-none">
          {STUDENT_SEGMENTS.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: seg.color }} aria-hidden />
              <span className="flex-1 whitespace-nowrap text-veda-bark/90">{seg.label}</span>
              <span className="whitespace-nowrap text-right">
                <strong className="font-bold text-veda-bark">{new Intl.NumberFormat('en-IN').format(seg.count)}</strong>{' '}
                <span className="text-veda-muted">({seg.percent}%)</span>
              </span>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </Card>
  );
}