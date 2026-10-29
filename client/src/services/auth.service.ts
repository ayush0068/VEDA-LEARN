import type { ApiItemResponse, AuthPayload, User } from '@/types';
import api from './api';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

export const registerRequest = async (input: RegisterInput): Promise<AuthPayload> => {
  const { data } = await api.post<ApiItemResponse<AuthPayload>>('/auth/register', input);
  return data.data;
};

export const loginRequest = async (input: LoginInput): Promise<AuthPayload> => {
  const { data } = await api.post<ApiItemResponse<AuthPayload>>('/auth/login', input);
  return data.data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get<ApiItemResponse<{ user: User }>>('/auth/me');
  return data.data.user;
};