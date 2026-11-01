import api from './api';
import type { ApiItemResponse } from '@/types';
import type { StudentDashboard } from '@/types/dashboard';

export const getStudentDashboard = async (): Promise<StudentDashboard> => {
  const { data } = await api.get<ApiItemResponse<StudentDashboard>>('/dashboard');
  return data.data;
};