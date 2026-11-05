import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, MutableRefObject } from 'react';

interface SearchContextValue {
  isOpen: boolean;
  /** Opens the search page. Pass the button that was pressed: the page grows out of it and folds back into it. */
  openSearch: (origin?: HTMLElement | null) => void;
  closeSearch: () => void;
  originRef: MutableRefObject<HTMLElement | null>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const originRef = useRef<HTMLElement | null>(null);

  const openSearch = useCallback((origin?: HTMLElement | null) => {
    originRef.current = origin ?? null;
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => setIsOpen(false), []);

  // Ctrl/Cmd + K or "/" opens the search from the keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((v) => {
          if (!v) originRef.current = null;
          return !v;
        });
      } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        originRef.current = null;
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ isOpen, openSearch, closeSearch, originRef }), [isOpen, openSearch, closeSearch]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSearch = (): SearchContextValue => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used inside <SearchProvider>');
  return ctx;
};