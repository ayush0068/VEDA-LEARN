import type { ApiListResponse, Feature } from '@/types';
import api from './api';

export const getFeatures = async (): Promise<Feature[]> => {
  const { data } = await api.get<ApiListResponse<Feature>>('/features');
  return data.data;
};