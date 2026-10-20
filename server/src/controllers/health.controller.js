const { getDbState } = require('../config/db');
const { env } = require('../config/env');

// GET /api/health
const getHealth = (_req, res) => {
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

module.exports = { getHealth };