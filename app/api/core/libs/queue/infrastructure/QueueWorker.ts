/* eslint-disable no-await-in-loop */
import { Logger } from 'api/log.v2/contracts/Logger';
import { performance } from 'perf_hooks';
import { inspect } from 'util';
import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass } from '../application/contracts/JobsDispatcher';
import { NonRetryableJobError, UnregisteredJobError } from './errors';
import { Job, QueueAdapter } from './QueueAdapter';

interface WorkerOptions {
  waitTime?: number;
}

const optionsDefaults: Required<WorkerOptions> = {
  waitTime: 1000,
};

const defaultPerformance = {
  count: 0,
  processingTime: 0,
  batchStart: 0,
};

interface Registry {
  [name: string]: (namespace: string) => Promise<Dispatchable>;
}

export type QueueWorkerErrorHandler = (error: Error, context?: { job: Job }) => void;

export class QueueWorker {
  private queueName: string;

  private adapter: QueueAdapter;

  private logger: Logger;

  private onError: QueueWorkerErrorHandler;

  private options: Required<WorkerOptions>;

  private stoppedCallback?: Function;

  private registry: Registry = {};

  private timesSlept = 0;

  private performance = {
    ...defaultPerformance,
  };

  constructor(
    queueName: string,
    adapter: QueueAdapter,
    logger: Logger,
    // eslint-disable-next-line no-empty-function
    onError?: QueueWorkerErrorHandler
  ) {
    this.queueName = queueName;
    this.adapter = adapter;
    this.options = { ...optionsDefaults };
    this.logger = logger;
    this.onError =
      onError ??
      ((e: Error, context?: { job: Job }) => {
        logger.error(inspect(e), { job: context?.job });
      });
  }

  private logAndResetMetrics() {
    this.logger.info('Performance metrics', {
      processingTime: this.performance.processingTime,
      count: this.performance.count,
      totalTime: performance.now() - this.performance.batchStart,
    });
    this.performance = { ...defaultPerformance };
  }

  private logProcess(start: number) {
    this.performance.processingTime += performance.now() - start;
    this.performance.count += 1;
  }

  private async sleep() {
    if (this.timesSlept === 0) {
      this.logAndResetMetrics();
      this.logger.info('sleeping', { waitTime: this.options.waitTime });
    }

    this.timesSlept += 1;
    return new Promise(resolve => {
      setTimeout(resolve, this.options.waitTime);
    });
  }

  private async peekJob() {
    let job = await this.adapter.pickJob(this.queueName);

    while (!this.isStopping() && !job) {
      await this.sleep();
      job = await this.adapter.pickJob(this.queueName);
    }

    if (this.isStopping()) return null;

    if (this.timesSlept) {
      this.logger.info('Resumed', { timesSlept: this.timesSlept });
      this.timesSlept = 0;
    }

    return job;
  }

  private async createDispatchable(job: Job) {
    if (!this.registry[job.name]) {
      throw new UnregisteredJobError(job.name);
    }

    return this.registry[job.name](job.namespace);
  }

  private async completeJob(job: Job) {
    return this.adapter.deleteJob(job);
  }

  // eslint-disable-next-line max-statements
  private async processJob(job: Job) {
    const start = performance.now();
    const dispatchable = await this.createDispatchable(job);

    try {
      this.logger.info('Processing job', { job });
      const startTime = performance.now();
      await dispatchable.handleDispatch(async () => this.adapter.renewJobLock(job), job.params, {
        namespace: job.namespace,
        retryCount: job.retryCount,
        maxRetries: job.options.maxRetries,
      });
      this.logger.info('Job processed', { job, processingTime: performance.now() - startTime });
      await this.completeJob(job);
    } catch (e) {
      await this.catchFailedJob(job, e);
    } finally {
      this.logProcess(start);
    }
  }

  private async catchFailedJob(job: Job, e: any) {
    let jobToReport = job;
    jobToReport = await this.adapter.updateLockWindow(job, job.options.lockWindow * 2);
    if (job.retryCount === job.options.maxRetries || e instanceof NonRetryableJobError) {
      jobToReport = await this.adapter.markJobAsFailed(job);
    }
    this.onError(e, { job: jobToReport });
  }

  async start() {
    this.performance.batchStart = performance.now();
    let job = await this.peekJob();
    while (job) {
      await this.processJob(job);
      job = await this.peekJob();
    }
    this.stopped();
  }

  private isStopping() {
    return !!this.stoppedCallback;
  }

  private stopped() {
    if (this.stoppedCallback) this.stoppedCallback();
  }

  async stop() {
    return new Promise<void>(resolve => {
      this.stoppedCallback = resolve;
    });
  }

  register<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    factory: (namespace: string) => Promise<T>
  ) {
    this.registry[dispatchable.name] = factory;
  }

  getRegisteredJobs() {
    return Object.keys(this.registry);
  }
}
