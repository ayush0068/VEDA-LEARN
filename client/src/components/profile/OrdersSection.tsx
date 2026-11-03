import { CreditCard, ReceiptText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApiRequestError } from '@/services/api';
import { getOrders } from '@/services/profile.service';
import type { Order } from '@/types/profile';
import { formatPrice } from '@/utils/format';
import { SectionCard } from './ProfileParts';

const STATUS: Record<Order['status'], { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'bg-emerald-100 text-emerald-900' },
  pending: { label: 'Pending', cls: 'bg-[#f6dfa6] text-veda-bark' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-900' },
  refunded: { label: 'Refunded', cls: 'bg-gold-pale text-veda-bark' },
};

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Purchases of the signed-in student (GET /api/profile/orders). */
export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getOrders()
      .then((list) => active && setOrders(list))
      .catch((err: ApiRequestError) => active && setError(err.message || 'Could not load your orders'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <SectionCard Icon={CreditCard} title="Orders & Payments" subtitle="Your course purchases and payment history.">
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : !orders ? (
        <div className="h-24 animate-pulse rounded-xl bg-gold-pale/50" aria-busy="true" />
      ) : orders.length === 0 ? (
        <div className="py-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-pale/60 text-saffron">
            <ReceiptText size={26} strokeWidth={1.5} aria-hidden />
          </span>
          <p className="mt-3 font-display text-[1.2rem] font-bold text-veda-bark">No orders yet</p>
          <p className="mt-1 text-sm text-veda-muted">Courses you purchase will show up here with their payment details.</p>
          <Link to="/courses" className="btn-primary mt-4 px-6">
            Browse courses
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-gold/25 bg-white/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.92rem] font-semibold text-veda-bark">
                  {o.orderNumber} <span className="font-normal text-veda-muted">· {DATE.format(new Date(o.createdAt))}</span>
                </p>
                <span className={`rounded-full px-3 py-1 text-[0.75rem] font-medium ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span>
              </div>
              <ul className="mt-2 space-y-0.5 text-[0.88rem] text-veda-text">
                {o.items.map((item) => (
                  <li key={item.slug} className="flex justify-between gap-3">
                    <Link to={`/courses/${item.slug}`} className="min-w-0 truncate hover:text-saffron">
                      {item.title}
                    </Link>
                    <span>{formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-gold/20 pt-2 text-[0.92rem] font-semibold text-veda-bark">
                <span>Total{o.paymentMethod ? ` · ${o.paymentMethod}` : ''}</span>
                <span>{formatPrice(o.total)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}