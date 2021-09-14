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

  private retryDelay: number;

  private id: string;

  constructor(
    lockName: string,
    task: () => void,
    maxLockTime: number = 2000,
    delayTimeBetweenTasks: number = 0,
    retryDelay: number = 200,
    id: string = '1'
  ) {
    this.maxLockTime = maxLockTime;
    this.retryDelay = retryDelay;
    this.delayTimeBetweenTasks = delayTimeBetweenTasks;
    this.lockName = `locks:${lockName}`;
    this.task = task;
    this.id = id;
  }

  async start() {
    this.redisClient = await Redis.createClient('redis://localhost:6379');
    this.redlock = await new Redlock([this.redisClient], {
      retryJitter: 25,
      retryDelay: this.retryDelay,
    });

    this.redisClient.on('error', async error => {
      if (error.code !== 'ECONNREFUSED') {
        throw error;
      }
    });

    this.lockTask();
  }

  async sleepTime(time: number) {
    await new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  async runTask() {
    try {
      await this.task();
    } catch (error) {
      handleError(error);
    }

    await this.sleepTime(this.delayTimeBetweenTasks);
  }

  async stop() {
    await new Promise(resolve => {
      this.stopTask = resolve;
    });

    console.log('shutting down', this.id);
    await this.redlock?.quit();
    await this.redisClient?.end(true);
    console.log('==');
  }

  async lockTask() {
    try {
      const lock = await this.redlock!.lock(
        this.lockName,
        this.maxLockTime + this.delayTimeBetweenTasks
      );

      console.log('locked!', this.id);

      if (this.stopTask) {
        this.stopTask(true);
        console.log('releasing because of stop', this.id);
        await lock.unlock();
        return;
      }

      await this.runTask();
      console.log('releasing because of finished', this.id);
      await lock.unlock();
    } catch (error) {
      if (error && error.name !== 'LockError') {
        throw error;
      }
    }

    this.lockTask();
  }
}
