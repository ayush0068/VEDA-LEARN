import { ArrowRight } from 'lucide-react';
import type { CartSummary } from '@/types';
import { formatPrice } from '@/utils/format';

interface OrderSummaryProps {
  summary: CartSummary;
  couponCode?: string;
  /** summary is being recalculated after a change */
  updating: boolean;
  onCheckout: () => void;
}

function Row({ label, value, className = '' }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <dt>{label}</dt>
      <dd className="font-medium text-veda-bark">{value}</dd>
    </div>
  );
}

export default function OrderSummary({ summary, couponCode, updating, onCheckout }: OrderSummaryProps) {
  const empty = summary.itemCount === 0;

  return (
    <section aria-labelledby="summary-heading" className="rounded-2xl border border-gold/25 bg-cream p-5 shadow-[0_24px_60px_-28px_rgba(90,45,15,0.45)] sm:p-6">
      <h2 id="summary-heading" className="font-display text-[1.35rem] font-semibold text-veda-bark">
        Order Summary
      </h2>

      <dl className={`mt-4 space-y-3 text-[0.98rem] text-veda-text transition-opacity ${updating ? 'opacity-60' : ''}`}>
        <Row label={`Subtotal (${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'})`} value={formatPrice(summary.listTotal)} />
        {summary.courseDiscount > 0 && <Row label="Course discount" value={`- ${formatPrice(summary.courseDiscount)}`} />}
        {summary.couponDiscount > 0 && (
          <Row label={`Coupon${couponCode ? ` (${couponCode})` : ''}`} value={`- ${formatPrice(summary.couponDiscount)}`} />
        )}
        {summary.savings === 0 && !empty && <Row label="Discount" value={formatPrice(0)} />}

        <div className="border-t border-gold/25 pt-3.5">
          <Row
            label={<span className="text-[1.05rem] font-semibold text-veda-bark">Total Amount</span>}
            value={<span className="font-display text-[1.6rem] font-bold">{formatPrice(summary.total)}</span>}
          />
        </div>
      </dl>

      {summary.savings > 0 && (
        <p className="mt-2 text-right text-[0.85rem] font-medium text-emerald-700" aria-live="polite">
          You are saving {formatPrice(summary.savings)} ({summary.savingsPercent}%)
        </p>
      )}

      <button
        type="button"
        onClick={onCheckout}
        disabled={empty}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#7a4015] to-veda-brown text-[0.98rem] font-semibold text-ivory shadow-[0_10px_22px_-10px_rgba(62,31,11,0.7)] transition hover:from-veda-brown hover:to-veda-bark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Proceed to Checkout <ArrowRight size={17} aria-hidden />
      </button>
    </section>
  );
}