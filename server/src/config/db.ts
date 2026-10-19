import mongoose from 'mongoose';
import { env } from './env';

export type DbState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown';

const READY_STATES: Record<number, DbState> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getDbState = (): DbState => READY_STATES[mongoose.connection.readyState] ?? 'unknown';

export const connectDB = async (): Promise<boolean> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] MongoDB connected (${mongoose.connection.name})`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] MongoDB connection failed: ${message}`);
    if (env.mongoRequired) {
      console.error('[db] MONGODB_REQUIRED=true -> shutting down.');
      process.exit(1);
    }
    console.warn('[db] Continuing without database (set MONGODB_REQUIRED=true to make it mandatory).');
    return false;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
