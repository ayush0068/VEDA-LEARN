import { Award, BookOpen, CircleX, CreditCard, Monitor, Settings, UserPlus, UsersRound, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import type { ModuleKey } from '@/types/team';

const TILES: { title: string; note: string; to: string; icon: typeof BookOpen; module?: ModuleKey }[] = [
  { title: 'Courses', note: 'Create, edit & manage', to: '/courses', icon: BookOpen, module: 'courses' },
  { title: 'Students', note: 'Manage learners', to: '/students', icon: UsersRound, module: 'students' },
  { title: 'Instructors', note: 'Add & manage teachers', to: '/instructors', icon: UserPlus, module: 'instructors' },
  { title: 'Live Classes', note: 'Schedule & control', to: '/live-classes', icon: Video, module: 'liveClasses' },
  { title: 'Orders & Payments', note: 'Track & manage', to: '/orders', icon: CreditCard },
  { title: 'Certificates', note: 'Issue & verify', to: '/certificates', icon: Award },
  { title: 'Website Content', note: 'Pages, blogs, banners', to: '/pages-content', icon: Monitor },
  { title: 'Settings', note: 'Platform & system', to: '/settings', icon: Settings },
];

export default function ManagementGrid() {
  const { can, isSuper } = useAuth();
  const tiles = TILES.filter((t) => (t.module ? can(t.module) : isSuper));
  if (tiles.length === 0) return null;

  return (
    <Card className="p-4">
      <header className="flex items-center gap-2.5">
        <CircleX size={24} strokeWidth={1.6} className="text-saffron" aria-hidden />
        <h2 className="font-display text-[1.12rem] font-bold text-veda-bark">Complete Management</h2>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
        {tiles.map(({ title, note, to, icon: Icon }) => (
          <Link
            key={title}
            to={to}
            className="flex flex-col items-center rounded-xl border border-line bg-white/65 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white"
          >
            <Icon size={26} strokeWidth={1.5} className="text-[#8A5426]" aria-hidden />
            <span className="mt-2.5 text-[0.8rem] font-bold leading-tight text-veda-bark">{title}</span>
            <span className="mt-1 text-[0.68rem] leading-tight text-veda-muted">{note}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}