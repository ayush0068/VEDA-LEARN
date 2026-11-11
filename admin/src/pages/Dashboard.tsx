import ManagementGrid from '@/components/dashboard/ManagementGrid';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import RecentOrders from '@/components/dashboard/RecentOrders';
import RevenueChart from '@/components/dashboard/RevenueChart';
import StatCards from '@/components/dashboard/StatCards';
import StudentsOverview from '@/components/dashboard/StudentsOverview';
import SystemHealth from '@/components/dashboard/SystemHealth';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';

export default function Dashboard() {
  return (
    <div className="space-y-3.5 sm:space-y-4">
      <WelcomeBanner />
      <StatCards />

      <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-2 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="lg:col-span-2 xl:col-span-1">
          <RevenueChart />
        </div>
        <StudentsOverview />
        <QuickActions />
      </div>

      <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-2 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <div className="lg:col-span-2 xl:col-span-1">
          <RecentOrders />
        </div>
        <RecentActivity />
        <SystemHealth />
      </div>

      <ManagementGrid />
    </div>
  );
}