import { ChartColumn, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { PointerEvent } from 'react';
import { Card, CardHeader } from '@/components/common/Card';
import { REVENUE_RANGES } from '@/data/dashboard';
import type { RevenueRange } from '@/data/dashboard';
import { useElementWidth } from '@/hooks/useElementWidth';

const PAD = { left: 46, right: 14, top: 14, bottom: 30 };
const Y_MAX = 5; // lakhs
const TICKS = [0, 1, 2, 3, 4, 5];

const rupees = (lakhs: number) => `₹${new Intl.NumberFormat('en-IN').format(Math.round(lakhs * 100000))}`;

export default function RevenueChart() {
  const [range, setRange] = useState<RevenueRange>('30');
  const [hover, setHover] = useState<number | null>(null);
  const [boxRef, width] = useElementWidth<HTMLDivElement>();
  const gradId = useId().replace(/:/g, '');

  const { values, labels } = REVENUE_RANGES[range];
  const height = width < 420 ? 220 : 250;
  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const innerH = height - PAD.top - PAD.bottom;
  const step = innerW / (values.length - 1);

  const x = (i: number) => PAD.left + i * step;
  const y = (v: number) => PAD.top + innerH - (v / Y_MAX) * innerH;

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${y(0)} L${x(0)} ${y(0)}Z`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - rect.left - PAD.left) / step);
    setHover(Math.min(values.length - 1, Math.max(0, i)));
  };

  return (
    <Card className="p-4 sm:p-5">
      <CardHeader
        icon={ChartColumn}
        title="Revenue Overview"
        action={
          <label className="relative">
            <span className="sr-only">Revenue range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RevenueRange)}
              className="cursor-pointer appearance-none rounded-lg border border-line bg-white/70 py-2 pl-3 pr-8 text-[0.8rem] font-semibold text-veda-bark focus:border-gold focus:outline-none"
            >
              {(Object.keys(REVENUE_RANGES) as RevenueRange[]).map((key) => (
                <option key={key} value={key}>
                  {REVENUE_RANGES[key].label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-veda-bark" aria-hidden />
          </label>
        }
      />

      <div
        ref={boxRef}
        className="relative mt-3 select-none"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={`Revenue, ${REVENUE_RANGES[range].label}`}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F59A3D" stopOpacity="0.55" />
                <stop offset="1" stopColor="#F9C58A" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {TICKS.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#E8D3B0" strokeWidth="1" strokeDasharray={t === 0 ? undefined : '3 4'} />
                <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="11.5" fill="#5A4636">
                  {t === 0 ? '0' : `₹${t}L`}
                </text>
              </g>
            ))}

            <path d={area} fill={`url(#${gradId})`} />
            <path d={line} fill="none" stroke="#F08A24" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

            {values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3} fill={hover === i ? '#fff' : '#F08A24'} stroke="#F08A24" strokeWidth="2" />
            ))}

            {labels.map((label, i) =>
              label && (width >= 480 || labels.slice(0, i).filter(Boolean).length % 2 === 0) ? (
                <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} fontSize="11.5" fill="#5A4636">
                  {label}
                </text>
              ) : null,
            )}

            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="#C58B2B" strokeOpacity=".5" strokeDasharray="3 3" />}
          </svg>
        )}

        {hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-veda-bark px-2.5 py-1.5 text-center text-[0.75rem] text-ivory shadow-lg"
            style={{ left: Math.min(Math.max(x(hover), 50), width - 50), top: y(values[hover]) - 10 }}
          >
            <span className="block font-semibold">{rupees(values[hover])}</span>
            {labels[hover] && <span className="block text-[0.68rem] text-gold-soft">{labels[hover]}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}