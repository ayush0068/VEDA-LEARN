import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Crown,
  FileText,
  House,
  Layers,
  LayoutGrid,
  Megaphone,
  MessageSquareQuote,
  CirclePlay,
  ShieldCheck,
  ShoppingCart,
  SquarePen,
  Ticket,
  UserCog,
  Users,
  UsersRound,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const DASHBOARD_ITEM: NavItem = { label: 'Dashboard', to: '/', icon: House };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'User Management',
    items: [
      { label: 'Students', to: '/students', icon: UsersRound },
      { label: 'Instructors', to: '/instructors', icon: Users },
      { label: 'Admins & Roles', to: '/admins-roles', icon: ShieldCheck },
    ],
  },
  {
    title: 'Course Management',
    items: [
      { label: 'Courses', to: '/courses', icon: BookOpen },
      { label: 'Categories', to: '/categories', icon: LayoutGrid },
      { label: 'Modules & Lessons', to: '/modules-lessons', icon: Layers },
      { label: 'Quizzes & Assignments', to: '/quizzes-assignments', icon: ClipboardCheck },
      { label: 'Certificates', to: '/certificates', icon: Award },
    ],
  },
  {
    title: 'Live Classes',
    items: [
      { label: 'Live Classes', to: '/live-classes', icon: Video },
      { label: 'Schedules', to: '/schedules', icon: CalendarDays },
      { label: 'Recordings', to: '/recordings', icon: CirclePlay },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Orders', to: '/orders', icon: ShoppingCart },
      { label: 'Payments', to: '/payments', icon: CreditCard },
      { label: 'Coupons & Offers', to: '/coupons-offers', icon: Ticket },
      { label: 'Subscriptions', to: '/subscriptions', icon: Crown },
    ],
  },
  {
    title: 'Content & Community',
    items: [
      { label: 'Pages & Content', to: '/pages-content', icon: FileText },
      { label: 'Blog & Articles', to: '/blog-articles', icon: SquarePen },
      { label: 'Community', to: '/community', icon: UserCog },
      { label: 'Testimonials', to: '/testimonials', icon: MessageSquareQuote },
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
    ],
  },
];

/** pathname -> readable title (used by the placeholder page) */
export const titleForPath = (pathname: string): string => {
  const all = [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];
  const hit = all.find((i) => i.to === pathname);
  if (hit) return hit.label;

  return (
    pathname
      .split('/')
      .filter(Boolean)
      .map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' · ') || 'Page'
  );
};