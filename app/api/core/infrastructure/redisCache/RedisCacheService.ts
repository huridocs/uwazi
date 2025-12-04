import { CacheOptions, CacheService } from 'api/core/libs/cache/CacheService';
import { tenants } from 'api/tenants';
import { RedisClient } from 'redis';

type Deps = {
  redisClient: RedisClient;
  tenants: typeof tenants;
};

class RedisCacheService implements CacheService {
  constructor(private deps: Deps) {}

  private createKey(key: string): string {
    const tenantName = this.deps.tenants.current().name;

    return `tenant:${tenantName}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const redisKey = this.createKey(key);

    return new Promise<T | null>((resolve, reject) => {
      this.deps.redisClient.get(redisKey, (err, reply) => {
        if (err) {
          return reject(err);
        }

        if (reply) {
          try {
            const parsed: T = JSON.parse(reply);
            return resolve(parsed);
          } catch (parseErr) {
            return reject(parseErr);
          }
        }

        return resolve(null);
      });
    });
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const redisKey = this.createKey(key);
    const stringValue = JSON.stringify(value);

    return new Promise<void>((resolve, reject) => {
      if (options?.ttl) {
        this.deps.redisClient.setex(redisKey, options.ttl, stringValue, err => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      } else {
        this.deps.redisClient.set(redisKey, stringValue, err => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      }
    });
  }

  async delete(key: string): Promise<void> {
    const redisKey = this.createKey(key);

    return new Promise<void>((resolve, reject) => {
      this.deps.redisClient.del(redisKey, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async deletePattern(pattern: string): Promise<void> {
    const redisPattern = this.createKey(pattern);

    return new Promise<void>((resolve, reject) => {
      this.deps.redisClient.keys(redisPattern, (err, keys) => {
        if (err) {
          reject(err);
          return;
        }

        if (keys && keys.length > 0) {
          // Delete all matching keys
          this.deps.redisClient.del(...keys, delErr => {
            if (delErr) {
              reject(delErr);
              return;
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
}

export { RedisCacheService };
