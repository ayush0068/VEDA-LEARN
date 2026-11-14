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