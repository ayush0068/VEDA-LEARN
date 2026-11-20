import api from './api';
import type { ApiItemResponse } from '@/types';
import type { CompleteResult, CourseLearning, LessonDetail } from '@/types/learning';

export const getCourseLearning = async (slug: string): Promise<CourseLearning> => (await api.get<ApiItemResponse<CourseLearning>>(`/learn/courses/${encodeURIComponent(slug)}`)).data.data;

export const getLessonDetail = async (id: string): Promise<LessonDetail> => (await api.get<ApiItemResponse<LessonDetail>>(`/learn/lessons/${id}`)).data.data;

export const setLessonDone = async (id: string, done: boolean): Promise<CompleteResult> => (await api.post<ApiItemResponse<CompleteResult>>(`/learn/lessons/${id}/complete`, { done })).data.data;

// ---- public (no login): the course page ----
export interface PublicOutlineLesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'document';
  durationMin: number;
  isPreview: boolean;
}
export interface PublicOutlineModule {
  id: string;
  number: number;
  title: string;
  lessons: PublicOutlineLesson[];
}

export const getPublicOutline = async (slug: string): Promise<PublicOutlineModule[]> =>
  (await api.get<ApiItemResponse<{ modules: PublicOutlineModule[] }>>(`/courses/${encodeURIComponent(slug)}/outline`)).data.data.modules;

export const getPreviewLesson = async (slug: string, lessonId: string): Promise<Pick<LessonDetail, 'course' | 'module' | 'lesson'>> =>
  (await api.get<ApiItemResponse<Pick<LessonDetail, 'course' | 'module' | 'lesson'>>>(`/courses/${encodeURIComponent(slug)}/preview/${lessonId}`)).data.data;