import type { AdminUser } from '@/types';
import { request } from './api';

export const loginRequest = (input: { email: string; password: string; remember: boolean }) =>
  request<{ user: AdminUser; token: string }>('/auth/login', { method: 'POST', body: input, auth: false });

export const getMe = async (): Promise<AdminUser> => (await request<{ user: AdminUser }>('/auth/me')).user;

/** first sign-in with a temporary password: choose your own (returns a fresh token) */
export const changePassword = (input: { currentPassword: string; newPassword: string; remember: boolean }) =>
  request<{ token: string }>('/profile/password', { method: 'PATCH', body: input });