import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';
import { RECENT_ORDERS } from '@/data/dashboard';

const TONES = ['#C9803A', '#A0522D', '#B8862B', '#8C5A3C', '#C26A1B'];

function Initial({ name, i }: { name: string; i: number }) {
  const letters = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold text-white ring-2 ring-white/80"
      style={{ background: TONES[i % TONES.length] }}
      aria-hidden
    >
      {letters}
    </span>
  );
}

function Status({ value }: { value: string }) {
  const paid = value === 'Paid';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.74rem] font-semibold ${
        paid ? 'bg-[#E4F4DC] text-ok' : 'bg-[#FDE6C8] text-[#D9822B]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${paid ? 'bg-ok' : 'bg-[#F28C28]'}`} aria-hidden />
      {value}
    </span>
  );
}

export default function RecentOrders() {
  return (
    <Card className="p-4">
      <CardHeader
        icon={ShoppingCart}
        title="Recent Orders"
        action={
          <Link to="/orders" className="flex items-center gap-1 whitespace-nowrap text-[0.8rem] font-bold text-veda-bark hover:text-saffron">
            View All <ArrowRight size={16} aria-hidden />
          </Link>
        }
      />

      {/* table (tablet and up) */}
      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[460px] border-separate border-spacing-0 text-left text-[0.8rem]">
          <thead>
            <tr className="bg-[#FBEBD6] text-veda-bark">
              {['Order ID', 'Student', 'Course', 'Amount', 'Status'].map((h, i) => (
                <th key={h} className={`px-2 py-2 text-[0.74rem] font-bold ${i === 0 ? 'rounded-l-lg' : ''} ${i === 4 ? 'rounded-r-lg' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_ORDERS.map((o, i) => (
              <tr key={o.id} className="text-veda-bark">
                <td className="border-b border-line/60 px-2 py-2.5 font-medium">{o.id}</td>
                <td className="border-b border-line/60 px-2 py-2.5">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <Initial name={o.student} i={i} />
                    {o.student}
                  </span>
                </td>
                <td className="max-w-[130px] truncate border-b border-line/60 px-2 py-2.5">{o.course}</td>
                <td className="border-b border-line/60 px-2 py-2.5 font-medium">{o.amount}</td>
                <td className="border-b border-line/60 px-2 py-2.5">
                  <Status value={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* cards (phones) */}
      <ul className="mt-3 divide-y divide-line/70 sm:hidden">
        {RECENT_ORDERS.map((o, i) => (
          <li key={o.id} className="flex items-center gap-3 py-3">
            <Initial name={o.student} i={i} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9rem] font-semibold text-veda-bark">{o.student}</p>
              <p className="truncate text-xs text-veda-muted">{o.course}</p>
              <p className="mt-0.5 text-xs text-veda-muted">{o.id}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-[0.9rem] font-semibold text-veda-bark">{o.amount}</span>
              <Status value={o.status} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}