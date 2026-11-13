// Single place where Vite env variables are read.
export const env = {
  apiUrl: (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/+$/, ''),
  // the public website: also where images like /images/courses/x.png live (client/public). Local dev = the client on port 5173.
  siteUrl: (import.meta.env.VITE_SITE_URL ?? (import.meta.env.DEV ? 'http://localhost:5173' : 'https://learn-veda.vercel.app')).replace(/\/+$/, ''),
} as const;