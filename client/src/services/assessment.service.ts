import api from './api';
import type { ApiItemResponse } from '@/types';
import type { AssignmentDetail, AttemptView, Hub, MySubmission, QuizIntro, Review, RunPayload, SavedAnswer, UploadedFile } from '@/types/assessments';

const get = async <T>(url: string): Promise<T> => (await api.get<ApiItemResponse<T>>(url)).data.data;
const send = async <T>(method: 'post' | 'put', url: string, body?: unknown): Promise<T> => (await api[method]<ApiItemResponse<T>>(url, body)).data.data;

export const getHub = () => get<Hub>('/assessments');
export const getQuizIntro = (id: string) => get<QuizIntro>(`/assessments/quizzes/${id}`);
export const startQuiz = (id: string) => send<RunPayload>('post', `/assessments/quizzes/${id}/start`);
export const getAttempt = (id: string) => get<AttemptView>(`/assessments/attempts/${id}`);
export const saveAnswer = (attemptId: string, answer: SavedAnswer) => send<{ saved: boolean }>('put', `/assessments/attempts/${attemptId}/answer`, answer);
export const submitQuiz = (attemptId: string, answers: SavedAnswer[]) => send<Review>('post', `/assessments/attempts/${attemptId}/submit`, { answers });

export const getAssignment = (id: string) => get<AssignmentDetail>(`/assessments/assignments/${id}`);
export const submitAssignment = (id: string, body: { text: string; link: string; files: UploadedFile[] }) => send<{ submission: MySubmission }>('post', `/assessments/assignments/${id}/submit`, body);

/** uploads one file (sent as the raw body); `onProgress` gets 0-100 */
export const uploadFile = async (file: File, onProgress?: (percent: number) => void): Promise<UploadedFile> => {
  const res = await api.post<ApiItemResponse<{ url: string; size: number; type: string; name: string }>>('/assessments/upload', file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) },
    timeout: 180000,
    onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    transformRequest: [(data) => data],
  });
  const d = res.data.data;
  return { name: d.name, url: d.url, size: d.size, type: d.type };
};