import { Outlet } from 'react-router-dom';
import ApiStatusBadge from '@/components/common/ApiStatusBadge';
import PageBackdrop from '@/components/common/PageBackdrop';
import { env } from '@/config/env';
import { useCart } from '@/context/CartContext';
import Footer from './Footer';
import Navbar from './Navbar';

export default function MainLayout() {
  const { count } = useCart();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar cartCount={count} />
      <main className="relative isolate flex-1">
        {/* faint Vedic art behind the page body (sections with their own background cover it) */}
        <PageBackdrop />
        <Outlet />
      </main>
      <Footer />
      {env.showApiStatus && <ApiStatusBadge />}
    </div>
  );
}