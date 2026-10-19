import type { Request, Response } from 'express';
import { getDbState } from '../config/db';
import { env } from '../config/env';

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'vedalearn-api',
    environment: env.nodeEnv,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: getDbState(),
  });
};
