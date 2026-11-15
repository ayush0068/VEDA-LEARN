import api from './api';
import type { ApiItemResponse } from '@/types';
import type { StudentLiveClass } from '@/types/liveClass';

export const getMyLiveClasses = async (): Promise<StudentLiveClass[]> => {
  const { data } = await api.get<ApiItemResponse<StudentLiveClass[]>>('/live-classes');
  return data.data;
};

export const getLiveClassInfo = async (id: string): Promise<StudentLiveClass> => {
  const { data } = await api.get<ApiItemResponse<StudentLiveClass>>(`/live-classes/${encodeURIComponent(id)}`);
  return data.data;
};

/** open to everybody: what the website's Live Classes page shows */
export const getPublicLiveClasses = async (): Promise<StudentLiveClass[] & PublicExtra[]> => {
  const { data } = await api.get<ApiItemResponse<(StudentLiveClass & PublicExtra)[]>>('/live-classes/public');
  return data.data;
};

export const getPublicLiveClass = async (id: string): Promise<StudentLiveClass & PublicExtra> => {
  const { data } = await api.get<ApiItemResponse<StudentLiveClass & PublicExtra>>(`/live-classes/public/${encodeURIComponent(id)}`);
  return data.data;
};

export interface PublicExtra {
  courseCategory: string;
  courseImage: string;
  registered: number;
}