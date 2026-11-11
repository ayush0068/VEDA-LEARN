export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  avatar: string;
  isActive: boolean;
  /** still using the temporary password an admin generated */
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  courses: number;
}

export interface StudentDetails extends Student {
  location: string;
  enrollments: { slug: string; title: string; completedLessons: number; totalLessons: number }[];
  orders: { count: number; paid: number; spent: number };
}

export interface StudentStats {
  total: number;
  active: number;
  pending: number;
  disabled: number;
  newThisMonth: number;
}

export interface Pagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export type StatusFilter = 'all' | 'active' | 'pending' | 'disabled';
export type SortKey = 'newest' | 'oldest' | 'name' | 'last-login';