import type { Pagination } from '@/types';

export interface AdminCourse {
  slug: string;
  title: string;
  category: string;
  image: string;
  previewVideo: string;
  syllabus: string;
  instructor: string;
  description: string;
  weeks: number | null;
  lessons: number | null;
  level: string;
  language: string;
  rating: number;
  studentsCount: number;
  price: number;
  originalPrice: number | null;
  badge: string;
  isPopular: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  title: string;
  lessons: number;
  weeks: number;
  topics: string[];
}

/** Text of the course page. Anything left empty is generated automatically by the website. */
export interface CourseContent {
  tagline: string;
  about: string;
  tags: string[];
  highlights: string[];
  learn: string[];
  audience: string[];
  curriculum: CourseModule[];
  instructor: { title: string; experience: string; bio: string; coursesConducted: number; students: number; rating: number };
  ratingCount: number;
  faqs: { q: string; a: string }[];
  bannerTitle: string;
}

export interface CourseStats {
  total: number;
  active: number;
  hidden: number;
  popular: number;
}

export interface CourseOptions {
  categories: { value: string; label: string }[];
  levels: string[];
  languages: string[];
  badges: string[];
  instructors: string[];
  highlights: { key: string; label: string }[];
}

export interface CourseList {
  courses: AdminCourse[];
  pagination: Pagination;
  stats: CourseStats;
}

export type CourseStatusFilter = 'all' | 'active' | 'hidden' | 'popular';
export type CourseSortKey = 'order' | 'newest' | 'oldest' | 'title' | 'price-asc' | 'price-desc';
export type UploadKind = 'image' | 'video' | 'document';