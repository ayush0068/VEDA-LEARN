import { env } from '@/config/env';

const TOKEN_KEY = 'vedalearn_admin_token';
export const UNAUTHORIZED_EVENT = 'admin:unauthorized';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string, remember: boolean): void => {
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    (remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** false for the login call (a wrong password must not look like an expired session) */
  auth?: boolean;
}

/** Calls the VedaLearn API and returns the `data` part of `{ success, data }`. Throws ApiError with a readable message. */
export async function request<T>(path: string, { method = 'GET', body, query, auth = true }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${env.apiUrl}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
  } catch (err) {
    throw new ApiError(err instanceof DOMException && err.name === 'AbortError' ? 'Request timed out' : 'Cannot reach the server. Is the backend running?');
  } finally {
    window.clearTimeout(timer);
  }

  let payload: { success?: boolean; message?: string; data?: T } | null = null;
  try {
    payload = await response.json();
  } catch {
    /* not JSON */
  }

  if (!response.ok || !payload?.success) {
    if (response.status === 401 && auth) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status);
  }

  return payload.data as T;
}