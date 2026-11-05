import type { ApiItemResponse, Course } from '@/types';
import api from './api';

export interface SearchOverview {
  trending: string[];
  suggested: Course[];
}

export interface SearchResults {
  query: string;
  total: number;
  results: Course[];
}

/** Trending searches + suggested courses (search box opened, nothing typed yet). Public, no login needed. */
export const getSearchOverview = async (): Promise<SearchOverview> => {
  const { data } = await api.get<ApiItemResponse<SearchOverview>>('/search');
  return data.data;
};

/** Live search while typing. Public, no login needed. */
export const searchCourses = async (q: string): Promise<SearchResults> => {
  const { data } = await api.get<ApiItemResponse<SearchResults>>('/search', { params: { q } });
  return data.data;
};