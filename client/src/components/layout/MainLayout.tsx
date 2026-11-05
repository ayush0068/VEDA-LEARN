import { Outlet } from 'react-router-dom';
import ApiStatusBadge from '@/components/common/ApiStatusBadge';
import PageBackdrop from '@/components/common/PageBackdrop';
import { env } from '@/config/env';
import SearchOverlay from '@/components/search/SearchOverlay';
import { useCart } from '@/context/CartContext';
import { SearchProvider } from '@/context/SearchContext';
import Footer from './Footer';
import MobileSearchFab from './MobileSearchFab';
import Navbar from './Navbar';

export default function MainLayout() {
  const { count } = useCart();

  return (
    <SearchProvider>
    <div className="flex min-h-screen flex-col">
      <Navbar cartCount={count} />
      <main className="relative isolate flex-1">
        {/* faint Vedic art behind the page body (sections with their own background cover it) */}
        <PageBackdrop />
        <Outlet />
      </main>
      <Footer />
      <MobileSearchFab />
      <SearchOverlay />
      {env.showApiStatus && <ApiStatusBadge />}
    </div>
    </SearchProvider>
  );
}