import Redis from 'redis';
import Redlock from 'redlock';
import { handleError } from 'api/utils/handleError';

export class DistributedLoop {
  private lockName: string;

  private task: () => Promise<void>;

  private redlock: Redlock;

  private stopTask: Function | undefined;

  private redisClient: Redis.RedisClient;

  private maxLockTime: number;

  private delayTimeBetweenTasks: number;

  private retryDelay: number;

  private port: number;

  private host: string;

  constructor(
    lockName: string,
    task: () => Promise<void>,
    options: {
      maxLockTime?: number;
      delayTimeBetweenTasks?: number;
      retryDelay?: number;
      port?: number;
      host?: string;
    }
  ) {
    const _options = {
      maxLockTime: 2000,
      delayTimeBetweenTasks: 1000,
      retryDelay: 200,
      port: 6379,
      host: 'localhost',
      ...options,
    };
    this.maxLockTime = _options.maxLockTime;
    this.retryDelay = _options.retryDelay;
    this.delayTimeBetweenTasks = _options.delayTimeBetweenTasks;
    this.lockName = `locks:${lockName}`;
    this.task = task;
    this.port = _options.port;
    this.host = _options.host;
    this.redisClient = Redis.createClient(`redis://${this.host}:${this.port}`);
    this.redlock = new Redlock([this.redisClient], {
      retryJitter: 0,
      retryDelay: this.retryDelay,
    });
  }

  async start() {
    // eslint-disable-next-line no-void
    void this.lockTask();
  }

  async waitBetweenTasks(delay = this.delayTimeBetweenTasks) {
    await new Promise(resolve => {
      setTimeout(resolve, delay);
    });
  }

  async runTask() {
    try {
      await this.task();
    } catch (error) {
      handleError(error, { useContext: false });
    }

    await this.waitBetweenTasks();
  }

  async stop() {
    await new Promise(resolve => {
      this.stopTask = resolve;
    });

    await this.redlock.quit();
    this.redisClient.end(true);
  }

  async lockTask(): Promise<void> {
    try {
      const lock = await this.redlock.lock(
        this.lockName,
        this.maxLockTime + this.delayTimeBetweenTasks
      );

      if (this.stopTask) {
        this.stopTask();
        return;
      }

      await this.runTask();
      await lock.unlock();
    } catch (error) {
      if (error instanceof Error && error.name !== 'LockError') {
        throw error;
      }
    }

    // eslint-disable-next-line no-void
    void this.lockTask();
  }
}
