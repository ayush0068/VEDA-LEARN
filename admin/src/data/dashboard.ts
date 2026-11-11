import {
  Award,
  BookOpen,
  CircleCheck,
  FileText,
  CirclePlay,
  Receipt,
  ShoppingCart,
  UserRound,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// SAMPLE DATA ONLY - replace with real values from /api/admin/* when the admin endpoints exist.

export const STATS: { label: string; value: string; delta: string; icon: LucideIcon }[] = [
  { label: 'Total Students', value: '12,846', delta: '+12.5%', icon: UserRound },
  { label: 'Total Courses', value: '186', delta: '+8.2%', icon: BookOpen },
  { label: 'Live Classes', value: '32', delta: '+6.7%', icon: CirclePlay },
  { label: 'Total Revenue', value: '₹18,76,420', delta: '+24.3%', icon: ShoppingCart },
  { label: 'Certificates Issued', value: '4,528', delta: '+14.9%', icon: Award },
];

/** values in lakhs (L). `labels` is parallel to `values` ('' = no label under that point). */
export const REVENUE_RANGES = {
  '30': {
    label: 'Last 30 Days',
    values: [0.9, 1.4, 1.2, 1.95, 2.15, 1.5, 1.75, 1.9, 2.55, 2.1, 2.9, 2.4, 3.55, 4.25, 4.05],
    labels: ['1 Oct', '', '5 Oct', '', '9 Oct', '', '13 Oct', '', '17 Oct', '', '21 Oct', '', '25 Oct', '', '29 Oct'],
  },
  '7': {
    label: 'Last 7 Days',
    values: [3.1, 3.4, 2.9, 3.8, 4.1, 3.7, 4.4],
    labels: ['23 Oct', '24 Oct', '25 Oct', '26 Oct', '27 Oct', '28 Oct', '29 Oct'],
  },
  '90': {
    label: 'Last 90 Days',
    values: [1.1, 1.6, 1.4, 2.0, 2.3, 2.1, 2.8, 3.2, 3.0, 3.7, 4.1, 4.3],
    labels: ['Aug', '', '', '', 'Sep', '', '', '', 'Oct', '', '', ''],
  },
} as const;
export type RevenueRange = keyof typeof REVENUE_RANGES;

export const STUDENT_SEGMENTS = [
  { label: 'Active Students', count: 9240, percent: 71.9, color: '#3FA535' },
  { label: 'New Students', count: 2380, percent: 18.5, color: '#F7B538' },
  { label: 'Inactive Students', count: 1226, percent: 9.6, color: '#F28C28' },
];
export const STUDENT_TOTAL = 12846;

export const RECENT_ORDERS = [
  { id: '#VO9284', student: 'Rohan Sharma', course: 'Vedic Astrology for Beginners', amount: '₹2,999', status: 'Paid' },
  { id: '#VO9283', student: 'Priya Verma', course: 'Bhagavad Gita – In-Depth Study', amount: '₹3,499', status: 'Paid' },
  { id: '#VO9282', student: 'Arjun Mehta', course: 'Mantra Science & Healing', amount: '₹1,999', status: 'Paid' },
  { id: '#VO9281', student: 'Neha Singh', course: 'Yoga & Meditation', amount: '₹2,499', status: 'Pending' },
  { id: '#VO9280', student: 'Kunal Tiwari', course: 'Vastu for a Harmonious Home', amount: '₹2,999', status: 'Paid' },
] as const;

export const RECENT_ACTIVITY: { title: string; note: string; time: string; icon: LucideIcon }[] = [
  { title: 'New student registered', note: '(Rohan Sharma)', time: '2 min ago', icon: UserRound },
  { title: 'Course published', note: '(Advanced Jyotish)', time: '15 min ago', icon: FileText },
  { title: 'Live class scheduled', note: '(Meditation & Breathwork)', time: '27 min ago', icon: Video },
  { title: 'Payment received', note: '(₹2,999 – Order #VO9284)', time: '34 min ago', icon: Receipt },
  { title: 'Certificate issued', note: '(Batch: Vedic Astrology)', time: '1 hour ago', icon: Award },
];

export const SYSTEM_HEALTH: { label: string; value: string; tone: 'ok' | 'text'; icon: LucideIcon; progress?: number }[] = [
  { label: 'Website', value: 'Online', tone: 'ok', icon: CircleCheck },
  { label: 'API Server', value: 'Online', tone: 'ok', icon: CircleCheck },
  { label: 'Database', value: 'Healthy', tone: 'ok', icon: CircleCheck },
  { label: 'Storage (Media)', value: '72% Used', tone: 'text', icon: CircleCheck, progress: 72 },
  { label: 'Backup', value: 'Last: Today, 2:00 AM', tone: 'text', icon: CircleCheck },
];