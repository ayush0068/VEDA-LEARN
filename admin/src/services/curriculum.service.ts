import type { Curriculum, CurriculumCourseList, CurriculumLesson, CurriculumModule, ContentStatus, LessonInput, ModuleInput } from '@/types/curriculum';
import { request } from './api';

const base = '/admin/curriculum';
const slugPath = (slug: string) => encodeURIComponent(slug);

export const listCurriculumCourses = () => request<CurriculumCourseList>(`${base}/courses`);
export const getCurriculum = (slug: string) => request<Curriculum>(`${base}/course/${slugPath(slug)}`);

export const createModule = (slug: string, input: ModuleInput) => request<CurriculumModule>(`${base}/course/${slugPath(slug)}/modules`, { method: 'POST', body: input });
export const updateModule = (id: string, patch: Partial<ModuleInput>) => request<CurriculumModule>(`${base}/modules/${id}`, { method: 'PATCH', body: patch });
export const deleteModule = (id: string) => request<{ deleted: boolean; lessons: number }>(`${base}/modules/${id}`, { method: 'DELETE' });
export const duplicateModule = (id: string) => request<CurriculumModule>(`${base}/modules/${id}/duplicate`, { method: 'POST' });
export const reorderModules = (slug: string, ids: string[]) => request<{ ok: boolean }>(`${base}/course/${slugPath(slug)}/modules/reorder`, { method: 'POST', body: { ids } });

export const createLesson = (moduleId: string, input: LessonInput) => request<CurriculumLesson>(`${base}/modules/${moduleId}/lessons`, { method: 'POST', body: input });
export const updateLesson = (id: string, patch: Partial<LessonInput>) => request<CurriculumLesson>(`${base}/lessons/${id}`, { method: 'PATCH', body: patch });
export const deleteLesson = (id: string) => request<{ deleted: boolean }>(`${base}/lessons/${id}`, { method: 'DELETE' });
export const duplicateLesson = (id: string) => request<CurriculumLesson>(`${base}/lessons/${id}/duplicate`, { method: 'POST' });
export const reorderLessons = (moduleId: string, ids: string[]) => request<{ ok: boolean }>(`${base}/modules/${moduleId}/lessons/reorder`, { method: 'POST', body: { ids } });
export const moveLesson = (id: string, moduleId: string) => request<CurriculumLesson>(`${base}/lessons/${id}/move`, { method: 'POST', body: { moduleId } });
export const setLessonsStatus = (ids: string[], status: ContentStatus) => request<{ updated: number }>(`${base}/lessons/bulk-status`, { method: 'POST', body: { ids, status } });