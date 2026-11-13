import { env } from '@/config/env';
import type { AdminCourse, CourseContent, CourseList, CourseOptions, CourseSortKey, CourseStatusFilter, UploadKind } from '@/types/course';
import { ApiError, UNAUTHORIZED_EVENT, clearToken, getToken, request } from './api';

/** Everything the course form can save. On create `title`, `category` and `price` are required. */
export type CoursePayload = Partial<Omit<AdminCourse, 'createdAt' | 'updatedAt' | 'slug'>> & { slug?: string; content?: CourseContent };

export interface CourseDetails {
  course: AdminCourse;
  content: CourseContent;
}

export const getCourseOptions = () => request<CourseOptions>('/admin/courses/options');

export const listCourses = (params: { q: string; category: string; status: CourseStatusFilter; sort: CourseSortKey; page: number; limit: number }) =>
  request<CourseList>('/admin/courses', { query: { ...params, status: params.status === 'all' ? undefined : params.status } });

export const getCourse = (slug: string) => request<CourseDetails>(`/admin/courses/${encodeURIComponent(slug)}`);

export const createCourse = (input: CoursePayload) => request<CourseDetails>('/admin/courses', { method: 'POST', body: input });

export const updateCourse = (slug: string, patch: CoursePayload) => request<CourseDetails>(`/admin/courses/${encodeURIComponent(slug)}`, { method: 'PATCH', body: patch });

export const deleteCourse = (slug: string) => request<{ deleted: boolean }>(`/admin/courses/${encodeURIComponent(slug)}`, { method: 'DELETE' });

/** Uploads a picture / video / PDF (raw body, so the browser can report progress). Resolves with the public link to save in the course. */
export const uploadFile = (kind: UploadKind, file: File, onProgress?: (percent: number) => void): Promise<{ url: string; size: number }> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${env.apiUrl}/admin/courses/upload/${kind}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError('Cannot reach the server. Is the backend running?'));
    xhr.ontimeout = () => reject(new ApiError('Upload timed out'));
    xhr.onload = () => {
      let payload: { success?: boolean; message?: string; data?: { url: string; size: number } } | null = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.success && payload.data) return resolve(payload.data);
      if (xhr.status === 401) {
        clearToken();
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
      return reject(new ApiError(payload?.message ?? `Upload failed (${xhr.status})`, xhr.status));
    };
    xhr.send(file);
  });

/**
 * Possible links for a stored picture / file. Paths like /images/x.png live in the website's public folder, so in local
 * development the website on port 5173 is tried first, then VITE_SITE_URL. Full links are used as they are.
 */
export const mediaCandidates = (value: string): string[] => {
  if (!value.startsWith('/')) return [value];
  const bases = [...(import.meta.env.DEV ? ['http://localhost:5173'] : []), env.siteUrl];
  return [...new Set(bases)].map((base) => `${base}${value}`);
};

export const mediaSrc = (value: string): string => mediaCandidates(value)[0];