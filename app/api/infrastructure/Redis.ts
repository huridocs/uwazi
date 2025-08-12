import { config } from 'api/config';
import { createClient, RedisClient } from 'redis';

let redisClient: RedisClient;

const Redis = {
  async connect(
    host: string = config.redis.host,
    port: number = config.redis.port
  ): Promise<RedisClient> {
    redisClient = createClient({ url: `redis://${host}:${port}` });
    redisClient.on('error', error => {
      if (error && error.code !== 'ECONNREFUSED') {
        throw error;
      }
    });
    return new Promise(resolve => {
      redisClient.on('connect', () => {
        resolve(redisClient);
      });
    });
  },

  async disconnect() {
    if (redisClient.connected) {
      return new Promise(resolve => {
        redisClient.on('end', resolve);
        redisClient.quit();
      });
    }
    return Promise.resolve();
  },

  get redisClient() {
    return redisClient;
  },
};

export { Redis };
