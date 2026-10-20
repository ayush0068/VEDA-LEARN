const mongoose = require('mongoose');
const { env } = require('./env');

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const getDbState = () => READY_STATES[mongoose.connection.readyState] || 'unknown';

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] MongoDB connected (${mongoose.connection.name})`);
    return true;
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`);
    if (env.mongoRequired) {
      console.error('[db] MONGODB_REQUIRED=true -> shutting down.');
      process.exit(1);
    }
    console.warn('[db] Continuing without database (set MONGODB_REQUIRED=true to make it mandatory).');
    return false;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDB, disconnectDB, getDbState };