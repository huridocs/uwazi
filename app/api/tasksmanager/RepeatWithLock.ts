import Redis from 'redis';
import Redlock from 'redlock';

export class RepeatWithLock {
  private lockName: string;

  private task: () => void;

  private redlock: Redlock | undefined;

  private stopTask: ((value: unknown) => void) | undefined;

  private redisClient: Redis.RedisClient | undefined;

  constructor(lockName: string, task: () => void, ) {
    this.lockName = `locks:${lockName}`;
    this.task = task;
  }

  async start() {
    this.redisClient = await Redis.createClient('redis://localhost:6379');
    this.redlock = await new Redlock([this.redisClient]);

    this.redisClient.on('error', async error => {
      if (error.code !== 'ECONNREFUSED') {
        throw error;
      }
      console.log(error);
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
      const lock = await this.redlock!.lock(this.lockName, 10000);

      if (this.stopTask) {
        await lock.unlock();
        this.stopTask(true);
        return;
      }

      await this.task();
      await lock.unlock();
    } catch (error) {
      if (error.name !== 'LockError') {
        throw error;
      }
    }

    this.lockTask();

  }
}
