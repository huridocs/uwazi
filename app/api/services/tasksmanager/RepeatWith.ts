import Redis from 'redis';
import Redlock from 'redlock';
import handleError from 'api/utils/handleError';

export class RepeatWith {
  private lockName: string;

  private task: () => void;

  private redlock: Redlock | undefined;

  private stopTask: Function | undefined;

  private redisClient: Redis.RedisClient | undefined;

  private maxLockTime: number;

  private delayTimeBetweenTasks: number;

  private retryDelay: number;

  private port: number;

  constructor(
    lockName: string,
    task: () => void,
    maxLockTime: number = 2000,
    delayTimeBetweenTasks: number = 0,
    retryDelay: number = 200,
    port: number = 6379
  ) {
    this.maxLockTime = maxLockTime;
    this.retryDelay = retryDelay;
    this.delayTimeBetweenTasks = delayTimeBetweenTasks;
    this.lockName = `locks:${lockName}`;
    this.task = task;
    this.port = port;
  }

  async start() {
    this.redisClient = await Redis.createClient(`redis://localhost:${this.port}`);
    this.redlock = await new Redlock([this.redisClient], {
      retryJitter: 0,
      retryDelay: this.retryDelay,
    });

    this.redisClient.on('error', error => {
      if (error.code !== 'ECONNREFUSED') {
        throw error;
      }
    });

    // eslint-disable-next-line no-void
    void this.lockTask();
  }

  async waitBetweenTasks() {
    await new Promise(resolve => {
      setTimeout(resolve, this.delayTimeBetweenTasks);
    });
  }

  async runTask() {
    try {
      await this.task();
    } catch (error) {
      handleError(error);
    }

    await this.waitBetweenTasks();
  }

  async stop() {
    await new Promise(resolve => {
      this.stopTask = resolve;
    });

    await this.redlock?.quit();
    await this.redisClient?.end(true);
  }

  async lockTask(): Promise<void> {
    try {
      const lock = await this.redlock!.lock(
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
      if (error && error.name !== 'LockError') {
        throw error;
      }
    }

    // eslint-disable-next-line no-void
    void this.lockTask();
  }
}
