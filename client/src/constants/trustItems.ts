import {
  Award,
  BookOpen,
  Clock,
  GraduationCap,
  Infinity as InfinityIcon,
  Leaf,
  MessagesSquare,
  MonitorPlay,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TrustItem {
  icon: LucideIcon;
  label: string;
}

// Edit this list to add / remove / reorder items in the scrolling trust bar.
// Includes features planned for the finished platform.
export const TRUST_ITEMS: TrustItem[] = [
  { icon: BookOpen, label: 'Authentic Vedic Content' },
  { icon: Video, label: 'Live Interactive Classes' },
  { icon: MonitorPlay, label: 'Recorded Sessions' },
  { icon: GraduationCap, label: 'Experienced Vedic Teachers' },
  { icon: Clock, label: 'Learn at Your Own Pace' },
  { icon: Award, label: 'Certificate on Completion' },
  { icon: MessagesSquare, label: 'Doubt Support & Community' },
  { icon: Smartphone, label: 'Access on Any Device' },
  { icon: ShieldCheck, label: 'Secure Online Payments' },
  { icon: InfinityIcon, label: 'Lifetime Course Access' },
  { icon: TrendingUp, label: 'Track Your Progress' },
  { icon: Leaf, label: 'Practical Wisdom for Daily Life' },
];