import type { ApiListResponse, Course } from '@/types';
import api from './api';

interface CourseParams {
  popular?: boolean;
  category?: string;
  limit?: number;
}

export const getCourses = async (params: CourseParams = {}): Promise<Course[]> => {
  const { data } = await api.get<ApiListResponse<Course>>('/courses', { params });
  return data.data;
};