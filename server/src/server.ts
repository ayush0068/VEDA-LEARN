import type { Server } from 'http';
import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';

let server: Server;

const start = async (): Promise<void> => {
  await connectDB();

  server = app.listen(env.port, () => {
    console.log(`[server] VedaLearn API running on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] Health check: http://localhost:${env.port}/api/health`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${env.port} is already in use. Change PORT in server/.env`);
    } else {
      console.error('[server] Failed to start:', err);
    }
    process.exit(1);
  });
};

const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n[server] ${signal} received, shutting down...`);
  server?.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void start();
