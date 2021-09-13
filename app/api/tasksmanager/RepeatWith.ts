import Redis from 'redis';
import Redlock from 'redlock';
import handleError from 'api/utils/handleError';

export class RepeatWith {
  private lockName: string;

  private task: () => void;

  private redlock: Redlock | undefined;

  private stopTask: ((value: unknown) => void) | undefined;

  private redisClient: Redis.RedisClient | undefined;

  private maxLockTime: number;

  private delayTimeBetweenTasks: number;

  constructor(
    lockName: string,
    task: () => void,
    maxLockTime: number = 10000,
    delayTimeBetweenTasks = 0
  ) {
    this.maxLockTime = maxLockTime;
    this.delayTimeBetweenTasks = delayTimeBetweenTasks;
    this.lockName = `locks:${lockName}`;
    this.task = task;
  }

  async start() {
    this.redisClient = await Redis.createClient('redis://localhost:6379');
    this.redlock = await new Redlock([this.redisClient], { retryJitter: 0, retryDelay: 20 });

    this.redisClient.on('error', async error => {
      if (error.code !== 'ECONNREFUSED') {
        throw error;
      }
    });

    this.redlock.on('error', err => {
      console.error('A redis error has occurred:', err);
    });

    this.lockTask();
  }

  async stop() {
    await new Promise(resolve => {
      this.stopTask = resolve;
    });

    await this.redlock?.quit();
    await this.redisClient?.end(true);
  }

  async lockTask() {
    try {
      const lock = await this.redlock!.lock(this.lockName, this.maxLockTime + this.delayTimeBetweenTasks);

      if (this.stopTask) {
        await lock.unlock();
        this.stopTask(true);
        return;
      }

      try {
        await this.task();
      } catch (error) {
        handleError(error);
      }
      await new Promise(resolve => {
        setTimeout(resolve, this.delayTimeBetweenTasks);
      });
      await lock.unlock();
    } catch (error) {
      if (error && error.name !== 'LockError') {
        throw error;
      }
    }

    this.lockTask();
  }
}
