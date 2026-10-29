import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';

export const TOKEN_KEY = 'vedalearn_token';

/** Error thrown by every API call. `status` is the HTTP status (undefined when the server can't be reached). */
export type ApiRequestError = Error & { status?: number };

/**
 * Token storage. "Remember me" -> localStorage (stays signed in after the browser closes),
 * otherwise sessionStorage (signed out when the tab/browser closes).
 */
export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const storeToken = (token: string, remember: boolean): void => {
  try {
    const keep = remember ? localStorage : sessionStorage;
    const drop = remember ? sessionStorage : localStorage;
    keep.setItem(TOKEN_KEY, token);
    drop.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

/** Reusable Axios instance. Every service (health, courses, auth...) imports this. */
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT automatically when the user is signed in
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
    const normalised: ApiRequestError = new Error(message);
    normalised.status = error.response?.status;
    return Promise.reject(normalised);
  },
);

export default api;