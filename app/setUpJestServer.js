import mongoose from 'mongoose';
import { Redis } from './api/infrastructure/Redis.js';

process.env.EXTERNAL_SERVICES = true;

mongoose.Promise = Promise;

mongoose.set('autoIndex', false);

// Polyfill structuredClone if not available (for Node versions < 17)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

afterAll(async () => {
  const client = Redis.redisClient;
  if (client && client.connected) {
    await Redis.disconnect();
  }
});
