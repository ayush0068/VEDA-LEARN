export type LiveStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LiveTab = 'upcoming' | 'live' | 'past' | 'cancelled';
export type LiveAccess = 'enrolled' | 'everyone';

export interface LiveFeatureFlags {
  chat: boolean;
  handRaise: boolean;
  polls: boolean;
  reactions: boolean;
  studentCamera: boolean;
  recording: boolean;
}

export interface LiveResource {
  title: string;
  url: string;
}

export interface AdminLiveClass {
  id: string;
  title: string;
  description: string;
  courseSlug: string;
  courseTitle: string;
  host: { id: string; name: string; role: string };
  startsAt: string;
  endsAt: string;
  durationMin: number;
  maxStudents: number;
  access: LiveAccess;
  status: LiveStatus;
  features: LiveFeatureFlags;
  resources: LiveResource[];
  startedAt: string | null;
  endedAt: string | null;
  cancelReason: string;
  peakStudents: number;
  attendeeCount: number;
  studentsNow: number;
  hostPresent: boolean;
  recording: { url: string; size: number; durationSec: number; createdAt: string | null } | null;
}

export interface AttendanceRow {
  userId: string;
  name: string;
  email: string;
  firstJoinedAt: string;
  lastLeftAt: string | null;
  totalSeconds: number;
  joins: number;
}

export interface LiveClassDetails extends AdminLiveClass {
  attendance: AttendanceRow[];
  polls: { question: string; options: { text: string; votes: number }[]; total: number; at: string }[];
  messageCount: number;
}

export interface LiveOptions {
  courses: { slug: string; title: string }[];
  hosts: { id: string; name: string; role: string }[];
  limits: { maxStudentsLimit: number; defaultMaxStudents: number };
}

export interface LiveStats {
  live: number;
  upcoming: number;
  past: number;
  cancelled: number;
  total: number;
}

export interface LiveList {
  classes: AdminLiveClass[];
  pagination: { page: number; pages: number; total: number; limit: number };
}

/** what the schedule form saves */
export interface LivePayload {
  title: string;
  description: string;
  courseSlug: string;
  host: string;
  startsAt: string; // ISO
  durationMin: number;
  maxStudents: number;
  access: LiveAccess;
  features: LiveFeatureFlags;
  resources: LiveResource[];
}