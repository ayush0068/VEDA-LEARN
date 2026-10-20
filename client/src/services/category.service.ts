import type { ApiListResponse, Category } from '@/types';
import api from './api';

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<ApiListResponse<Category>>('/categories');
  return data.data;
};