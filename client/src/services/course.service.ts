import type { CourseContentData } from '@/constants/courseDetails';
import type { ApiItemResponse, ApiListResponse, Course } from '@/types';
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

/** Course page text written in the admin panel (null when the admin has not written any). */
export const getCourseContent = async (slug: string): Promise<CourseContentData | null> => {
  const { data } = await api.get<ApiItemResponse<{ course: Course; content: CourseContentData | null }>>(`/courses/${encodeURIComponent(slug)}`);
  return data.data.content;
};