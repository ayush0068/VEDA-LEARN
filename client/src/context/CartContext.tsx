import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'vedalearn_cart';

interface CartContextValue {
  items: string[]; // course slugs
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const readStored = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

/** Lightweight cart (course slugs saved in localStorage). Replace with a server-backed cart when checkout is built. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const has = useCallback((slug: string) => items.includes(slug), [items]);
  const toggle = useCallback(
    (slug: string) => setItems((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    [],
  );

  const value = useMemo(() => ({ items, count: items.length, has, toggle }), [items, has, toggle]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}