const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { env } = require('./config/env');
const { seedAllIfEmpty } = require('./services/seed.service');

let server;

const start = async () => {
  const dbConnected = await connectDB();

  if (dbConnected && env.autoSeed) {
    try {
      const result = await seedAllIfEmpty();
      Object.entries(result).forEach(([name, count]) => {
        if (count) console.log(`[seed] inserted ${count} default ${name}`);
      });
    } catch (err) {
      console.warn('[seed] auto-seed skipped:', err.message);
    }
  }

  server = app.listen(env.port, () => {
    console.log(`[server] VedaLearn API running on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] Health check: http://localhost:${env.port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${env.port} is already in use. Change PORT in server/.env`);
    } else {
      console.error('[server] Failed to start:', err);
    }
    process.exit(1);
  });
};

const shutdown = (signal) => {
  console.log(`\n[server] ${signal} received, shutting down...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();