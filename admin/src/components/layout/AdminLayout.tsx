import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();

  // close the drawer after navigating, and lock page scroll while it is open
  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawer]);

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-line lg:block">
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? '' : 'pointer-events-none'}`} aria-hidden={!drawer}>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={drawer ? 0 : -1}
          onClick={() => setDrawer(false)}
          className={`absolute inset-0 bg-veda-bark/45 transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-[284px] max-w-[85vw] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            drawer ? 'translate-x-0 shadow-2xl shadow-veda-bark/40' : '-translate-x-full shadow-none'
          }`}
        >
          <Sidebar onNavigate={() => setDrawer(false)} />
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Close menu"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur"
          >
            <X size={18} />
          </button>
        </aside>
      </div>

      <div className="lg:pl-[260px]">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="mx-auto w-full max-w-[1760px] px-3 pb-10 pt-4 sm:px-5 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}