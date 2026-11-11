// Single place where Vite env variables are read.
export const env = {
  apiUrl: (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/+$/, ''),
  siteUrl: (import.meta.env.VITE_SITE_URL ?? 'https://learn-veda.vercel.app').replace(/\/+$/, ''),
} as const;