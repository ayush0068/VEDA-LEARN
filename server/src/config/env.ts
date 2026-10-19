import dotenv from 'dotenv';
import path from 'path';

// Loads server/.env (works for both `tsx watch` and compiled `node dist/server.js`)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

const toList = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const port = Number(process.env.PORT);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number.isFinite(port) && port > 0 ? port : 5000,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/vedalearn',
  mongoRequired: toBool(process.env.MONGODB_REQUIRED, false),
  clientUrls: toList(process.env.CLIENT_URLS, [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]),
} as const;

export type Env = typeof env;
