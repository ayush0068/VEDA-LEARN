import { Bell, CreditCard, Heart, Settings, ShieldCheck, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Gender, NotificationPrefs, PrivacyPrefs } from '@/types/profile';

// Images come from client/public (your own files). To use a different file, only change the path here.
// A missing file is fine: the page falls back to a plain warm gradient.
export const PROFILE_BANNER_SRC = '/images/profile/banner.png'; // sunrise + temple picture, top-right of the banner
export const PROFILE_LANDSCAPE_SRC = '/images/profile/landscape.png'; // temple + trees + hills, along the page bottom

export interface ProfileNavItem {
  key: string;
  label: string;
  to: string;
  Icon: LucideIcon;
  end?: boolean;
}

export const PROFILE_NAV: ProfileNavItem[] = [
  { key: 'overview', label: 'Profile Overview', to: '/profile', Icon: UserRound, end: true },
  { key: 'personal', label: 'Personal Information', to: '/profile/personal', Icon: UserRound },
  { key: 'security', label: 'Account & Security', to: '/profile/security', Icon: ShieldCheck },
  { key: 'notifications', label: 'Notification Preferences', to: '/profile/notifications', Icon: Bell },
  { key: 'orders', label: 'Orders & Payments', to: '/profile/orders', Icon: CreditCard },
  { key: 'wishlist', label: 'Wishlist', to: '/profile/wishlist', Icon: Heart },
  { key: 'privacy', label: 'Privacy & Settings', to: '/profile/privacy', Icon: Settings },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: '', label: 'Select' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export const NOTIFICATION_OPTIONS: { key: keyof NotificationPrefs; label: string; text: string }[] = [
  { key: 'liveClasses', label: 'Live class reminders', text: 'Get alerted before a live class you registered for starts.' },
  { key: 'courseUpdates', label: 'Course updates', text: 'New lessons, modules and announcements in your courses.' },
  { key: 'assignments', label: 'Assignment alerts', text: 'Reminders when an assignment is due soon or overdue.' },
  { key: 'offers', label: 'Offers & new courses', text: 'Discounts, coupons and newly launched courses.' },
  { key: 'emailNotifications', label: 'Email notifications', text: 'Also send these alerts to your email address.' },
];

export const PRIVACY_OPTIONS: { key: keyof PrivacyPrefs; label: string; text: string }[] = [
  { key: 'profileVisible', label: 'Public profile', text: 'Let other learners in the community see your profile.' },
  { key: 'showEmail', label: 'Show my email', text: 'Display your email address on your public profile.' },
  { key: 'showProgress', label: 'Show my learning progress', text: 'Let others see the courses you are learning and your certificates.' },
];