import type { AdminUser } from '@/types';
import { request } from './api';

export const loginRequest = (input: { email: string; password: string; remember: boolean }) =>
  request<{ user: AdminUser; token: string }>('/auth/login', { method: 'POST', body: input, auth: false });

export const getMe = async (): Promise<AdminUser> => (await request<{ user: AdminUser }>('/auth/me')).user;