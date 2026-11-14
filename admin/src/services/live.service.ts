import { env } from '@/config/env';
import type { LiveClassDetails, LiveList, LiveOptions, LivePayload, LiveStats, LiveTab } from '@/types/live';
import { ApiError, UNAUTHORIZED_EVENT, clearToken, getToken, request } from './api';
import type { RecordingUploader } from '@/live/liveRoom';

const base = '/admin/live-classes';

export const getLiveOptions = () => request<LiveOptions>(`${base}/options`);

export const listLiveClasses = (params: { tab: LiveTab; q: string; course: string; page: number; limit: number }) =>
  request<LiveList & { stats: LiveStats }>(base, { query: params });

export const getLiveClass = (id: string) => request<LiveClassDetails>(`${base}/${id}`);

export const createLiveClass = (input: LivePayload) => request<LiveClassDetails>(base, { method: 'POST', body: input });

export const updateLiveClass = (id: string, input: Partial<LivePayload>) => request<LiveClassDetails>(`${base}/${id}`, { method: 'PATCH', body: input });

export const cancelLiveClass = (id: string, reason: string) => request<unknown>(`${base}/${id}/cancel`, { method: 'POST', body: { reason } });

export const deleteLiveClass = (id: string) => request<{ deleted: boolean }>(`${base}/${id}`, { method: 'DELETE' });

export const deleteRecording = (id: string) => request<unknown>(`${base}/${id}/recording`, { method: 'DELETE' });

/** the website address students open to join (works with the VITE_SITE_URL / local dev setup) */
export const studentJoinLink = (id: string) => `${env.siteUrl}/live/${id}`;

/** uploads the recording in small pieces while the class is running */
export const recordingUploader = (classId: string): RecordingUploader => ({
  start: () => request<{ recordingId: string }>(`${base}/${classId}/recording/start`, { method: 'POST' }),
  chunk: async (recordingId, blob) => {
    const token = getToken();
    const res = await fetch(`${env.apiUrl}${base}/${classId}/recording/${recordingId}/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: blob,
    });
    if (res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    if (!res.ok) throw new ApiError('Recording upload failed. Check the server disk space.', res.status);
  },
  finish: async (recordingId, durationSec) => {
    await request<unknown>(`${base}/${classId}/recording/${recordingId}/finish`, { method: 'POST', body: { durationSec } });
  },
});