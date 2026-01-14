import { Redis } from 'api/infrastructure/Redis';
import mongoose from 'mongoose';

process.env.EXTERNAL_SERVICES = true;

mongoose.Promise = Promise;

mongoose.set('autoIndex', false);

afterAll(async () => {
  const client = Redis.redisClient;
  if (client && client.connected) {
    await Redis.disconnect();
  }
});
