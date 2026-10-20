import { Outlet } from 'react-router-dom';
import ApiStatusBadge from '@/components/common/ApiStatusBadge';
import { env } from '@/config/env';
import { useCart } from '@/context/CartContext';
import Footer from './Footer';
import Navbar from './Navbar';

export default function MainLayout() {
  const { count } = useCart();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar cartCount={count} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {env.showApiStatus && <ApiStatusBadge />}
    </div>
  );
}