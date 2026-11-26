const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { env } = require('./config/env');
const { initLiveSocket } = require('./live/socket');
const { closeStaleLiveClasses } = require('./services/liveClass.service');
const { flushAll: flushAdminActivity } = require('./services/adminActivity.service');
const { ensureSuperAdmin } = require('./services/adminTeam.service');
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

  // admin roles: somebody has to own the panel (see services/adminTeam.service.js)
  if (dbConnected) {
    try {
      const owner = await ensureSuperAdmin();
      if (owner) console.log(`[admin] ${owner} is now the super admin (they can add admins and choose what each one may do)`);
    } catch (err) {
      console.warn('[admin] super admin check skipped:', err.message);
    }
  }

  server = app.listen(env.port, () => {
    console.log(`[server] VedaLearn API running on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] Health check: http://localhost:${env.port}/api/health`);
  });

  // live classes: WebRTC signalling runs on the same port (Socket.IO, /socket.io)
  initLiveSocket(server);
  if (dbConnected) closeStaleLiveClasses().catch((err) => console.warn('[live] cleanup skipped:', err.message));

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
      await flushAdminActivity().catch(() => {});
      await disconnectDB();
      process.exit(0);
    });
  }
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();