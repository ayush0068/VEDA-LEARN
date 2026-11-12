export type InstructorRole = 'lead' | 'instructor' | 'assistant' | 'guest';
export type PermissionKey = 'editCourses' | 'hostLiveClasses' | 'viewStudents' | 'gradeAssessments' | 'issueCertificates' | 'moderateCommunity';
export type SlotKind = 'live-class' | 'office-hours' | 'mentoring' | 'review';
export type Permissions = Record<PermissionKey, boolean>;

/** one recurring weekly session (day 0 = Sunday ... 6 = Saturday, times as "18:30") */
export interface ScheduleSlot {
  id: string;
  day: number;
  start: string;
  end: string;
  kind: SlotKind;
  title: string;
  courseSlug: string;
}
export type SlotDraft = Omit<ScheduleSlot, 'id'>;

export interface Instructor {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  title: string;
  instructorRole: InstructorRole;
  expertise: string[];
  courseCount: number;
  sessionsPerWeek: number;
  hoursPerWeek: number;
  permissionCount: number;
}

export interface InstructorDetails extends Instructor {
  location: string;
  bio: string;
  experienceYears: number;
  permissions: Permissions;
  courses: { slug: string; title: string }[];
  timezone: string;
  schedule: ScheduleSlot[];
}

export interface InstructorStats {
  total: number;
  active: number;
  pending: number;
  disabled: number;
  sessionsPerWeek: number;
}

export interface InstructorOptions {
  roles: { value: InstructorRole; label: string; description: string; permissions: Permissions }[];
  permissions: { key: PermissionKey; label: string; description: string }[];
  kinds: { value: SlotKind; label: string }[];
  courses: { slug: string; title: string; isActive: boolean }[];
}

/** a session in the all-instructors weekly timetable */
export interface ScheduleEntry extends ScheduleSlot {
  instructorId: string;
  name: string;
  avatar: string;
  instructorRole: InstructorRole;
  courseTitle: string;
}