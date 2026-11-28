import type { AssignmentFull, AssignmentInput, AssignmentRow, CourseOption, Overview, QuizAnalytics, QuizFull, QuizInput, QuizRow, SubmissionList, SubmissionRow } from '@/types/assessments';
import { request } from './api';

const base = '/admin/assessments';

export const listCourses = () => request<CourseOption[]>(`${base}/courses`);
export const getOverview = () => request<Overview>(`${base}/overview`);

export interface Filters {
  courseSlug?: string;
  status?: string;
  q?: string;
}

export const listQuizzes = (f: Filters = {}) => request<QuizRow[]>(`${base}/quizzes`, { query: { ...f } });
export const getQuiz = (id: string) => request<QuizFull>(`${base}/quizzes/${id}`);
export const createQuiz = (input: QuizInput) => request<QuizFull>(`${base}/quizzes`, { method: 'POST', body: input });
export const updateQuiz = (id: string, patch: Partial<QuizInput>) => request<QuizFull>(`${base}/quizzes/${id}`, { method: 'PATCH', body: patch });
export const deleteQuiz = (id: string) => request<{ id: string }>(`${base}/quizzes/${id}`, { method: 'DELETE' });
export const duplicateQuiz = (id: string) => request<QuizFull>(`${base}/quizzes/${id}/duplicate`, { method: 'POST' });
export const getQuizAnalytics = (id: string) => request<QuizAnalytics>(`${base}/quizzes/${id}/analytics`);

export const getAssignment = (id: string) => request<AssignmentFull>(`${base}/assignments/${id}`);
export const listAssignments = (f: Filters = {}) => request<AssignmentRow[]>(`${base}/assignments`, { query: { ...f } });
export const createAssignment = (input: AssignmentInput) => request<AssignmentFull>(`${base}/assignments`, { method: 'POST', body: input });
export const updateAssignment = (id: string, patch: Partial<AssignmentInput>) => request<AssignmentFull>(`${base}/assignments/${id}`, { method: 'PATCH', body: patch });
export const deleteAssignment = (id: string) => request<{ id: string }>(`${base}/assignments/${id}`, { method: 'DELETE' });
export const duplicateAssignment = (id: string) => request<AssignmentFull>(`${base}/assignments/${id}/duplicate`, { method: 'POST' });
export const listSubmissions = (id: string) => request<SubmissionList>(`${base}/assignments/${id}/submissions`);
export const gradeSubmission = (id: string, body: { grade?: number | null; feedback: string; status: 'graded' | 'returned' }) =>
  request<SubmissionRow>(`${base}/submissions/${id}`, { method: 'PATCH', body });