import { FileText, Megaphone, Plus, Tag, UserPlus, Video, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';

const ACTIONS = [
  { label: 'Add Course', to: '/courses/new', icon: Plus },
  { label: 'Schedule Live Class', to: '/live-classes/schedule', icon: Video },
  { label: 'Add Student', to: '/students/new', icon: UserPlus },
  { label: 'Create Offer', to: '/coupons-offers/new', icon: Tag },
  { label: 'Send Announcement', to: '/announcements/new', icon: Megaphone },
  { label: 'Manage Pages', to: '/pages-content', icon: FileText },
];

export default function QuickActions() {
  return (
    <Card className="p-4">
      <CardHeader icon={Zap} title="Quick Actions" />

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        {ACTIONS.map(({ label, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-white/70 px-2.5 py-2.5 text-[0.74rem] font-semibold text-veda-bark transition hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white"
          >
            <Icon size={17} strokeWidth={1.7} className="shrink-0 text-[#8A5426]" aria-hidden />
            <span className="min-w-0 break-words leading-[1.2]">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}