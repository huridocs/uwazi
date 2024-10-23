import Redis from 'redis';
import Redlock from 'redlock';
import { handleError } from 'api/utils/handleError';

type OptionsProps = {
  maxLockTime?: number;
  delayTimeBetweenTasks?: number;
  retryDelay?: number;
  port?: number;
  host?: string;
  stopTimeout?: number;
};

export class DistributedLoop {
  private TEN_SECONDS_IN_MS = 10_000;

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

  private stopTimeout: number;

  constructor(
    lockName: string,
    task: () => Promise<void>,
    {
      maxLockTime = 2000,
      delayTimeBetweenTasks = 1000,
      retryDelay = 200,
      port = 6379,
      host = 'localhost',
      stopTimeout,
    }: OptionsProps
  ) {
    this.stopTimeout = stopTimeout || this.TEN_SECONDS_IN_MS;
    this.maxLockTime = maxLockTime;
    this.retryDelay = retryDelay;
    this.delayTimeBetweenTasks = delayTimeBetweenTasks;
    this.lockName = `locks:${lockName}`;
    this.task = task;
    this.port = port;
    this.host = host;
    this.redisClient = Redis.createClient(`redis://${this.host}:${this.port}`);
    this.redlock = new Redlock([this.redisClient], {
      retryJitter: 0,
      retryDelay: this.retryDelay,
    });
  }

  start() {
    // eslint-disable-next-line no-void
    void this.lockTask();

    return this.stop;
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

  private logStopTimeoutMessage() {
    console.log(
      `The task ${this.lockName} tried to be stopped and reached stop timeout of ${this.stopTimeout} milliseconds`
    );
  }

  private async _stop() {
    let timeoutId;

    await new Promise(resolve => {
      this.stopTask = resolve;

      timeoutId = setTimeout(() => {
        this.logStopTimeoutMessage();
        resolve(undefined);
      }, this.stopTimeout);
    });

    clearTimeout(timeoutId);
  }

  stop = async () => {
    await this._stop();
    await this.redlock.quit();
    this.redisClient.end(true);
  };

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
