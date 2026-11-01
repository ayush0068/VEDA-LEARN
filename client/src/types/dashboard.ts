export type EnrollmentStatus = 'not-started' | 'in-progress' | 'completed';

export interface DashboardEnrollment {
  slug: string;
  title: string;
  category: string;
  image: string;
  instructor: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  status: EnrollmentStatus;
  currentModule: string;
  nextLesson: string;
  startedAt: string;
  lastActivityAt: string;
}

export interface DashboardRecommended {
  slug: string;
  title: string;
  category: string;
  image: string;
  instructor: string;
  rating: number;
  studentsCount: number;
  price: number;
  originalPrice?: number;
  lessons?: number;
}

export interface DashboardAssignment {
  id: string;
  title: string;
  courseSlug: string;
  courseTitle: string;
  dueAt: string; // ISO
}

export type ActivityType = 'lesson' | 'live' | 'assignment' | 'certificate';

export interface DashboardActivity {
  type: ActivityType;
  title: string;
  subtitle: string;
  at: string; // ISO
}

export interface DashboardStats {
  enrolled: number;
  inProgress: number;
  liveClassesAttended: number;
  liveClassesRegistered: number;
  certificates: number;
  overallPercent: number;
  lessonsDone: number;
  lessonsTotal: number;
}

export interface StudentDashboard {
  serverTime: string;
  user: { id: string; name: string; email: string };
  isDemo: boolean;
  stats: DashboardStats;
  enrollments: DashboardEnrollment[];
  recommended: DashboardRecommended[];
  assignments: DashboardAssignment[];
  activity: DashboardActivity[];
}