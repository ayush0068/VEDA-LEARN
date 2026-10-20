import type { NavItem } from '@/types';

export const SITE = {
  name: 'VedaLearn',
  tagline: 'Ancient Wisdom. Online, For You.',
  description:
    'A modern learning platform for authentic Vedic knowledge, guided by experienced teachers and rooted in traditional wisdom.',
} as const;

// Replace the "#" placeholders with your real profile URLs.
export const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/' },
  { name: 'YouTube', href: 'https://youtube.com/' },
  { name: 'Facebook', href: 'https://facebook.com/' },
  { name: 'X', href: 'https://x.com/' },
] as const;

export const FOOTER_QUICK_LINKS: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Courses', to: '/courses' },
  { label: 'Live Classes', to: '/live-classes' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export const FOOTER_HELP_LINKS: NavItem[] = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Refund Policy', to: '/refund-policy' },
  { label: 'Support', to: '/support' },
];