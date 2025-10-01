import { config } from 'api/config';
import { createClient, RedisClient } from 'redis';

let redisClient: RedisClient | undefined;
let connectingPromise: Promise<RedisClient> | null = null;

const Redis = {
  async connect(
    host: string = config.redis.host,
    port: number = config.redis.port
  ): Promise<RedisClient> {
    if (redisClient && (redisClient as any).connected) {
      return redisClient;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    redisClient = createClient({ url: `redis://${host}:${port}` });

    // Avoid MaxListenersExceededWarning in environments where connect() may be called repeatedly
    if (typeof (redisClient as any).setMaxListeners === 'function') {
      (redisClient as any).setMaxListeners(0);
    }

    redisClient.on('error', error => {
      if (error && (error as any).code !== 'ECONNREFUSED') {
        throw error;
      }
    });

    connectingPromise = new Promise<RedisClient>(resolve => {
      redisClient!.once('connect', () => {
        connectingPromise = null;
        resolve(redisClient!);
      });
    });

    return connectingPromise;
  },

  async disconnect() {
    if (redisClient && (redisClient as any).connected) {
      return new Promise(resolve => {
        redisClient!.once('end', resolve);
        redisClient!.quit();
      });
    }
    return Promise.resolve();
  },

  get redisClient() {
    return redisClient as RedisClient;
  },
};

export { Redis };
