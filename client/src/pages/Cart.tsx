import { ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartHero from '@/components/cart/CartHero';
import CartItem from '@/components/cart/CartItem';
import CouponBox from '@/components/cart/CouponBox';
import OrderSummary from '@/components/cart/OrderSummary';
import Recommended from '@/components/cart/Recommended';
import TrustStrip from '@/components/cart/TrustStrip';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getCart, previewCart } from '@/services/cart.service';
import type { CartView } from '@/types';

function ItemsSkeleton() {
  return (
    <ul className="mt-5 space-y-3" aria-busy="true" aria-label="Loading your cart">
      {[0, 1, 2].map((i) => (
        <li key={i} className="grid animate-pulse grid-cols-[6.5rem_1fr] gap-3 rounded-xl border border-gold/15 bg-ivory p-3 sm:grid-cols-[10rem_1fr]">
          <div className="aspect-[4/3] rounded-lg bg-gold-pale/60 sm:aspect-[16/10]" />
          <div className="space-y-3 py-1">
            <div className="h-5 w-3/4 rounded bg-gold-pale/60" />
            <div className="h-4 w-1/2 rounded bg-gold-pale/40" />
            <div className="h-4 w-2/3 rounded bg-gold-pale/40" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, add, remove, clear, couponCode, applyCoupon, removeCoupon, whenSynced } = useCart();

  const [view, setView] = useState<CartView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const userId = user?.id ?? null;
  const itemsKey = items.join(',');

  // Load the price breakdown from the server whenever the cart changes.
  // Signed in -> GET /cart (MongoDB cart). Guest -> POST /cart/preview with the slugs from localStorage.
  useEffect(() => {
    if (authLoading) return;

    let active = true;
    setFetching(true);

    (async () => {
      try {
        await whenSynced(); // let pending add / remove requests reach the server first
        const next = userId ? await getCart() : await previewCart({ slugs: items, couponCode });
        if (active) {
          setView(next);
          setError('');
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your cart');
      } finally {
        if (active) {
          setFetching(false);
          setLoaded(true);
        }
      }
    })();

    return () => {
      active = false;
    };
    // `items` is covered by itemsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId, itemsKey, couponCode, reloadKey, whenSynced]);

  // removals show instantly; additions appear once the server has priced them
  const shown = view ? view.items.filter((course) => items.includes(course.slug)) : [];
  const suggestions = view ? view.recommended.filter((course) => !items.includes(course.slug)) : [];
  const isEmpty = loaded && !error && items.length === 0;
  const waiting = !loaded || (authLoading && !view);

  const checkout = () => {
    if (user) navigate('/checkout');
    else navigate('/login', { state: { from: { pathname: '/checkout' } } });
  };

  const clearAll = () => {
    if (window.confirm('Remove all courses from your cart?')) clear();
  };

  return (
    <>
      <CartHero />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative -mt-8 grid gap-6 lg:-mt-12 lg:grid-cols-[minmax(0,1fr)_23.5rem] lg:items-start">
          {/* ---------------- cart items ---------------- */}
          <section
            aria-labelledby="cart-items-heading"
            className="rounded-2xl border border-gold/20 bg-cream/80 p-4 shadow-soft backdrop-blur-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="cart-items-heading" className="font-display text-[1.4rem] font-semibold text-veda-bark sm:text-[1.6rem]">
                Cart Items ({items.length})
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.85rem] text-veda-text transition-colors hover:bg-gold-pale hover:text-saffron"
                >
                  <Trash2 size={15} aria-hidden /> Clear Cart
                </button>
              )}
            </div>

            {waiting ? (
              <ItemsSkeleton />
            ) : error && !view ? (
              <div role="alert" className="mt-5 rounded-xl border border-red-300/60 bg-red-50/70 p-5 text-center">
                <p className="text-[0.95rem] text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="mt-3 inline-flex h-10 items-center rounded-lg border border-veda-brown/70 px-5 text-sm font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
                >
                  Try again
                </button>
              </div>
            ) : isEmpty ? (
              <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-gold/40 bg-ivory/70 px-5 py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-pale text-saffron">
                  <ShoppingBag size={28} strokeWidth={1.5} aria-hidden />
                </span>
                <p className="mt-4 font-display text-[1.4rem] font-semibold text-veda-bark">Your cart is empty</p>
                <p className="mt-1.5 max-w-xs text-[0.92rem] text-veda-muted">Explore our courses and add the wisdom you want to learn.</p>
                <Link
                  to="/courses"
                  className="mt-5 inline-flex h-11 items-center rounded-full bg-veda-brown px-7 text-[0.92rem] font-medium text-ivory transition-colors hover:bg-veda-bark"
                >
                  Explore Courses
                </Link>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {shown.map((course, i) => (
                  <CartItem key={course.slug} course={course} index={i} onRemove={remove} />
                ))}
              </ul>
            )}
          </section>

          {/* ---------------- summary / coupon / trust ---------------- */}
          {!isEmpty && (
            <aside className="space-y-4 lg:sticky lg:top-24">
              {view ? (
                <>
                  <OrderSummary summary={view.summary} couponCode={view.coupon?.code} updating={fetching} onCheckout={checkout} />
                  <CouponBox
                    coupon={view.coupon}
                    couponError={view.couponError}
                    disabled={items.length === 0}
                    onApply={applyCoupon}
                    onRemove={removeCoupon}
                  />
                </>
              ) : (
                <div className="h-64 animate-pulse rounded-2xl border border-gold/20 bg-cream/70" aria-hidden />
              )}
              <TrustStrip />
            </aside>
          )}
        </div>

        {view && <Recommended courses={suggestions} onAdd={add} />}
      </div>
    </>
  );
}