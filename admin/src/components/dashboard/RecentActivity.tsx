import { Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';
import { RECENT_ACTIVITY } from '@/data/dashboard';

export default function RecentActivity() {
  return (
    <Card className="p-4">
      <CardHeader
        icon={Activity}
        title="Recent Activity"
        action={
          <Link to="/activity" className="flex items-center gap-1 whitespace-nowrap text-[0.8rem] font-bold text-veda-bark hover:text-saffron">
            View All <ArrowRight size={16} aria-hidden />
          </Link>
        }
      />

      <ul className="mt-3.5 space-y-3">
        {RECENT_ACTIVITY.map(({ title, note, time, icon: Icon }) => (
          <li key={title} className="flex items-start gap-3 sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-peach text-[#C77A2B]">
              <Icon size={18} strokeWidth={1.7} aria-hidden />
            </span>
            <p className="min-w-0 flex-1 text-[0.8rem] leading-snug text-veda-bark/90">
              <strong className="font-bold text-veda-bark">{title}</strong> {note}
              <span className="mt-0.5 block text-[0.74rem] text-veda-muted sm:hidden">{time}</span>
            </p>
            <span className="hidden shrink-0 text-[0.78rem] text-veda-muted sm:block">{time}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}