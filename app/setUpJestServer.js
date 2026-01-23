import mongoose from 'mongoose';
import { Redis } from 'app/api/infrastructure/Redis.js';

process.env.EXTERNAL_SERVICES = true;

mongoose.Promise = Promise;

mongoose.set('autoIndex', false);

afterAll(async () => {
  const client = Redis.redisClient;
  if (client && client.connected) {
    await Redis.disconnect();
  }
});
