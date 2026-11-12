import type { Pagination, SortKey, StatusFilter } from '@/types';
import type { Instructor, InstructorDetails, InstructorOptions, InstructorRole, InstructorStats, Permissions, ScheduleEntry, SlotDraft } from '@/types/instructor';
import { request } from './api';

export interface InstructorList {
  instructors: Instructor[];
  pagination: Pagination;
  stats: InstructorStats;
  /** false when the server has no SMTP settings (the panel then opens the admin's own mail app instead) */
  emailConfigured: boolean;
}

export interface InstructorCredentials {
  instructor: Instructor;
  temporaryPassword: string;
}

export interface InstructorPatch {
  name?: string;
  phone?: string;
  isActive?: boolean;
  title?: string;
  bio?: string;
  experienceYears?: number;
  expertise?: string[];
  instructorRole?: InstructorRole;
  permissions?: Permissions;
  courses?: string[];
  schedule?: SlotDraft[];
}

export const getInstructorOptions = () => request<InstructorOptions>('/admin/instructors/options');

export const listInstructors = (params: { q: string; status: StatusFilter; role: InstructorRole | ''; sort: SortKey; page: number; limit: number }) =>
  request<InstructorList>('/admin/instructors', {
    query: { ...params, status: params.status === 'all' ? undefined : params.status, role: params.role || undefined },
  });

export const getScheduleOverview = async () => (await request<{ entries: ScheduleEntry[] }>('/admin/instructors/schedule')).entries;

export const getInstructor = async (id: string) => (await request<{ instructor: InstructorDetails }>(`/admin/instructors/${id}`)).instructor;

export const createInstructor = (input: { name: string; email: string; phone: string; title: string; instructorRole: InstructorRole }) =>
  request<InstructorCredentials>('/admin/instructors', { method: 'POST', body: input });

export const updateInstructor = async (id: string, patch: InstructorPatch) =>
  (await request<{ instructor: InstructorDetails }>(`/admin/instructors/${id}`, { method: 'PATCH', body: patch })).instructor;

export const resetInstructorPassword = (id: string) => request<InstructorCredentials>(`/admin/instructors/${id}/reset-password`, { method: 'POST' });

export const emailInstructorCredentials = (id: string, password: string) =>
  request<{ sent: boolean }>(`/admin/instructors/${id}/email-credentials`, { method: 'POST', body: { password } });

export const deleteInstructor = (id: string) => request<{ deleted: boolean }>(`/admin/instructors/${id}`, { method: 'DELETE' });