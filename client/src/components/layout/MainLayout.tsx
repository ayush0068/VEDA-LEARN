import { Outlet } from 'react-router-dom';
import ApiStatusBadge from '@/components/common/ApiStatusBadge';
import { env } from '@/config/env';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar cartCount={0} />
      <main className="flex-1">
        <Outlet />
      </main>
      {env.showApiStatus && <ApiStatusBadge />}
    </div>
  );
}
