import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import { NAV_ITEMS } from '@/constants/navigation';

interface NavbarProps {
  cartCount?: number;
}

export default function Navbar({ cartCount = 0 }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/courses?q=${encodeURIComponent(q)}`);
    setQuery('');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-2 text-[0.92rem] font-medium transition-colors ${
      isActive
        ? 'text-saffron after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-gold'
        : 'text-veda-text hover:text-saffron'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gold/25 bg-ivory/90 backdrop-blur">
      <nav
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Logo />

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-full p-2 text-veda-brown transition-colors hover:bg-gold-pale/60"
            aria-label="Search courses"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <Link
            to="/cart"
            className="relative rounded-full p-2 text-veda-brown transition-colors hover:bg-gold-pale/60"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link to="/login" className="btn-outline hidden px-5 py-2 sm:inline-flex">
            Login
          </Link>
          <Link to="/register" className="btn-primary hidden px-5 py-2 sm:inline-flex">
            Join Now
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2 text-veda-brown hover:bg-gold-pale/60 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Search bar */}
      {searchOpen && (
        <div className="animate-fade-in border-t border-gold/20 bg-cream/70">
          <form onSubmit={onSearch} className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6" role="search">
            <Search size={18} className="text-veda-muted" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Vedic Astrology, Vastu, Bhagavad Gita…"
              className="w-full bg-transparent py-1.5 text-sm text-veda-bark placeholder:text-veda-muted focus:outline-none"
              aria-label="Search courses"
            />
            <button type="submit" className="btn-primary px-4 py-1.5">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-gold/20 bg-ivory lg:hidden">
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-[0.95rem] font-medium ${
                      isActive ? 'bg-gold-pale/60 text-saffron' : 'text-veda-text hover:bg-cream'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="grid grid-cols-2 gap-3 pt-3 sm:hidden">
              <Link to="/login" className="btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Join Now
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
