import { Check, Loader2, TicketPercent, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CartCoupon } from '@/types';
import { formatPrice } from '@/utils/format';

interface CouponBoxProps {
  /** coupon currently applied (from the server's calculation) */
  coupon: CartCoupon | null;
  /** error about the saved coupon (e.g. it expired) */
  couponError?: string;
  disabled: boolean;
  onApply: (code: string) => Promise<string | null>;
  onRemove: () => void;
}

export default function CouponBox({ coupon, couponError, disabled, onApply, onRemove }: CouponBoxProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || disabled) return;
    setBusy(true);
    setError('');
    const message = await onApply(code);
    setBusy(false);
    if (message) setError(message);
    else setCode('');
  };

  return (
    <section aria-labelledby="coupon-heading" className="rounded-2xl border border-gold/25 bg-cream p-4 shadow-soft sm:p-5">
      <h2 id="coupon-heading" className="flex items-center gap-2.5 text-[0.95rem] font-medium text-veda-bark">
        <TicketPercent size={21} strokeWidth={1.5} className="text-saffron" aria-hidden />
        Have a Coupon Code?
      </h2>

      {coupon ? (
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-emerald-600/30 bg-emerald-50/70 px-3.5 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-[0.88rem] text-emerald-800">
            <Check size={17} className="shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="font-semibold">{coupon.code}</span> applied &middot; saved {formatPrice(coupon.amount)}
            </span>
          </p>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove coupon ${coupon.code}`}
            className="shrink-0 rounded-md p-1 text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-3.5 flex gap-2.5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Coupon code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={30}
              aria-invalid={Boolean(error)}
              className="h-11 w-full rounded-xl border border-gold/25 bg-ivory px-3.5 text-[0.92rem] text-veda-bark placeholder:text-veda-muted focus:border-gold focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy || disabled || !code.trim()}
            className="inline-flex h-11 min-w-[5.2rem] items-center justify-center rounded-xl border border-veda-brown/70 px-4 text-[0.92rem] font-semibold text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-veda-brown"
          >
            {busy ? <Loader2 size={17} className="animate-spin" aria-label="Applying" /> : 'Apply'}
          </button>
        </form>
      )}

      {(error || (!coupon && couponError)) && (
        <p role="alert" className="mt-2 px-1 text-[0.82rem] text-red-700">
          {error || couponError}
        </p>
      )}
    </section>
  );
}