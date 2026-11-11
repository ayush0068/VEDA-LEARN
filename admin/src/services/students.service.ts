import type { Pagination, SortKey, Student, StudentDetails, StudentStats, StatusFilter } from '@/types';
import { request } from './api';

export interface StudentList {
  students: Student[];
  pagination: Pagination;
  stats: StudentStats;
  /** false when the server has no SMTP settings (the panel then opens the admin's own mail app instead) */
  emailConfigured: boolean;
}

export interface Credentials {
  student: Student;
  temporaryPassword: string;
}

export const listStudents = (params: { q: string; status: StatusFilter; sort: SortKey; page: number; limit: number }) =>
  request<StudentList>('/admin/students', { query: { ...params, status: params.status === 'all' ? undefined : params.status } });

export const getStudent = async (id: string) => (await request<{ student: StudentDetails }>(`/admin/students/${id}`)).student;

export const createStudent = (input: { name: string; email: string; phone: string }) =>
  request<Credentials>('/admin/students', { method: 'POST', body: input });

export const updateStudent = async (id: string, patch: { name?: string; phone?: string; isActive?: boolean }) =>
  (await request<{ student: Student }>(`/admin/students/${id}`, { method: 'PATCH', body: patch })).student;

export const resetStudentPassword = (id: string) => request<Credentials>(`/admin/students/${id}/reset-password`, { method: 'POST' });

export const emailCredentials = (id: string, password: string) =>
  request<{ sent: boolean }>(`/admin/students/${id}/email-credentials`, { method: 'POST', body: { password } });

export const deleteStudent = (id: string) => request<{ deleted: boolean }>(`/admin/students/${id}`, { method: 'DELETE' });