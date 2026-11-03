import type { User } from '@/types';

export type Gender = '' | 'male' | 'female' | 'other' | 'prefer-not-to-say';

export interface NotificationPrefs {
  liveClasses: boolean;
  courseUpdates: boolean;
  assignments: boolean;
  offers: boolean;
  emailNotifications: boolean;
}

export interface PrivacyPrefs {
  profileVisible: boolean;
  showEmail: boolean;
  showProgress: boolean;
}

/** GET /api/profile */
export interface Profile extends User {
  studentId: string;
  isActive: boolean;
  phone: string;
  /** YYYY-MM-DD, empty when not set */
  dateOfBirth: string;
  gender: Gender;
  location: string;
  bio: string;
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
}

/** fields the "Personal Information" form can change */
export type ProfileUpdate = Partial<Pick<Profile, 'name' | 'phone' | 'dateOfBirth' | 'gender' | 'location' | 'bio'>>;

export interface OrderItem {
  slug: string;
  title: string;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}