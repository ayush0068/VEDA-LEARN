import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  addCartItemRequest,
  applyCouponRequest,
  clearCartRequest,
  mergeCartRequest,
  previewCart,
  removeCartItemRequest,
  removeCouponRequest,
} from '@/services/cart.service';
import type { CartState } from '@/types';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'vedalearn_cart';
const COUPON_KEY = 'vedalearn_cart_coupon';

interface CartContextValue {
  items: string[]; // course slugs
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  /** coupon applied to the cart (null when none) */
  couponCode: string | null;
  /** resolves to an error message, or null when the coupon was applied */
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => void;
  /** resolves when every pending server update has finished (the cart page waits for it before loading) */
  whenSynced: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const readStoredItems = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const readStoredCoupon = (): string | null => {
  try {
    return localStorage.getItem(COUPON_KEY) || null;
  } catch {
    return null;
  }
};

const clearStored = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUPON_KEY);
  } catch {
    /* storage unavailable */
  }
};

const noop = () => undefined;
const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

/**
 * Cart for the whole site.
 * - Signed out: course slugs live in localStorage (works exactly like before).
 * - Signed in: the cart is stored in MongoDB through /api/cart. Changes show instantly (optimistic) and are
 *   sent to the server one after another; the guest cart is merged into the account cart right after login.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<string[]>(readStoredItems);
  const [couponCode, setCouponCode] = useState<string | null>(readStoredCoupon);

  const itemsRef = useRef(items);
  const couponRef = useRef(couponCode);
  const userIdRef = useRef(userId);
  itemsRef.current = items;
  couponRef.current = couponCode;
  userIdRef.current = userId;

  // --- server update queue: requests run one after another so they can never overtake each other ---
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingRef = useRef(0);

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    pendingRef.current += 1;
    const wrapped = async () => {
      try {
        return await task();
      } finally {
        pendingRef.current -= 1;
      }
    };
    const run = queueRef.current.then(wrapped);
    queueRef.current = run.then(noop, noop);
    return run;
  }, []);

  const whenSynced = useCallback(() => queueRef.current.then(noop), []);

  // when nothing else is waiting, the server's answer is the truth
  const syncFromServer = useCallback((state: CartState) => {
    if (pendingRef.current === 0) {
      setItems(state.slugs);
      setCouponCode(state.couponCode);
    }
  }, []);

  // guests: keep the cart in localStorage
  useEffect(() => {
    if (userId) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (couponCode) localStorage.setItem(COUPON_KEY, couponCode);
      else localStorage.removeItem(COUPON_KEY);
    } catch {
      /* storage unavailable */
    }
  }, [items, couponCode, userId]);

  // sign in -> merge the guest cart into the account cart; sign out -> empty cart
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      if (wasSignedIn.current) {
        wasSignedIn.current = false;
        setItems([]);
        setCouponCode(null);
        clearStored();
      }
      return;
    }

    wasSignedIn.current = true;
    const guestItems = itemsRef.current;
    const guestCoupon = couponRef.current;

    enqueue(() => mergeCartRequest({ slugs: guestItems, couponCode: guestCoupon }))
      .then((state) => {
        clearStored();
        syncFromServer(state);
      })
      .catch(noop);
  }, [userId, authLoading, enqueue, syncFromServer]);

  const has = useCallback((slug: string) => items.includes(slug), [items]);

  const add = useCallback(
    (slug: string) => {
      setItems((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      if (!userIdRef.current) return;
      enqueue(() => addCartItemRequest(slug))
        .then(syncFromServer)
        .catch(() => setItems((prev) => prev.filter((s) => s !== slug))); // server refused -> undo
    },
    [enqueue, syncFromServer],
  );

  const remove = useCallback(
    (slug: string) => {
      setItems((prev) => prev.filter((s) => s !== slug));
      if (!userIdRef.current) return;
      enqueue(() => removeCartItemRequest(slug))
        .then(syncFromServer)
        .catch(() => setItems((prev) => (prev.includes(slug) ? prev : [...prev, slug])));
    },
    [enqueue, syncFromServer],
  );

  const toggle = useCallback(
    (slug: string) => {
      if (itemsRef.current.includes(slug)) remove(slug);
      else add(slug);
    },
    [add, remove],
  );

  const clear = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    if (!userIdRef.current) return;
    enqueue(() => clearCartRequest()).then(syncFromServer).catch(noop);
  }, [enqueue, syncFromServer]);

  const applyCoupon = useCallback(
    async (code: string): Promise<string | null> => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return 'Please enter a coupon code';

      try {
        if (userIdRef.current) {
          const state = await enqueue(() => applyCouponRequest(normalized));
          setCouponCode(state.couponCode);
        } else {
          // guests: ask the server whether the code works for this cart, then remember it locally
          const view = await previewCart({ slugs: itemsRef.current, couponCode: normalized });
          if (itemsRef.current.length === 0) return 'Add a course to your cart first';
          if (view.couponError || !view.coupon) return view.couponError ?? 'Invalid coupon code';
          setCouponCode(view.coupon.code);
        }
        return null;
      } catch (err) {
        return messageOf(err);
      }
    },
    [enqueue],
  );

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    if (!userIdRef.current) return;
    enqueue(() => removeCouponRequest()).catch(noop);
  }, [enqueue]);

  const value = useMemo<CartContextValue>(
    () => ({ items, count: items.length, has, toggle, add, remove, clear, couponCode, applyCoupon, removeCoupon, whenSynced }),
    [items, has, toggle, add, remove, clear, couponCode, applyCoupon, removeCoupon, whenSynced],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}