import type { HealthResponse } from '@/types';
import api from './api';

export const getHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>('/health');
  return data;
};
