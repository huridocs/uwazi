import { config } from 'api/config';
import Redis from 'redis';

let clientPromise: Promise<Redis.RedisClient> | null = null;

export const ApplicationRedisClient = {
  async getInstance(createClient: (typeof Redis)['createClient'] = Redis.createClient) {
    if (clientPromise) {
      return clientPromise;
    }

    clientPromise = new Promise((resolve, reject) => {
      const client = createClient(`redis://${config.redis.host}:${config.redis.port}`);
      client.on('ready', () => {
        resolve(client);
      });
      client.on('error', reject);
    });

    return clientPromise;
  },

  async close() {
    if (clientPromise) {
      (await clientPromise).quit();
      clientPromise = null;
      return true;
    }

    return false;
  },
};

// eslint-disable-next-line camelcase
export const TESTING_clean = () => {
  clientPromise = null;
};
