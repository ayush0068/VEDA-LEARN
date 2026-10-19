// Single place where Vite env variables are read. Everything else imports from here.
export const env = {
  apiUrl: (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/+$/, ''),
  introVideoUrl: import.meta.env.VITE_INTRO_VIDEO_URL ?? '',
  showApiStatus: import.meta.env.DEV && import.meta.env.VITE_SHOW_API_STATUS !== 'false',
} as const;
