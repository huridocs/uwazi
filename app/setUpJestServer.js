import mongoose from 'mongoose';
import { elasticClient } from 'api/search/elastic';
import { Redis } from 'api/infrastructure/Redis';

process.env.EXTERNAL_SERVICES = true;

mongoose.Promise = Promise;

mongoose.set('autoIndex', false);

afterAll(async () => {
  try {
    await elasticClient.close();
  } catch (e) {
    // ignore
  }

  try {
    const client = Redis.redisClient;
    if (client && client.connected) {
      await Redis.disconnect();
    }
  } catch (e) {
    // ignore
  }
});
