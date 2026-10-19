import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';

export const TOKEN_KEY = 'vedalearn_token';

/** Reusable Axios instance. Every service (health, courses, auth...) imports this. */
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically once auth exists (no-op until a token is stored)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* storage unavailable */
  }
  return config;
});

// Normalise errors so UI code only deals with one shape
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      (error.code === 'ECONNABORTED'
        ? 'Request timed out'
        : error.request
          ? 'Cannot reach the server'
          : error.message);
    return Promise.reject(new Error(message));
  },
);

export default api;
