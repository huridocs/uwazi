/* eslint-disable max-statements */
/* eslint-disable no-void */
/* eslint-disable max-classes-per-file */
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { DefaultTestingQueueAdapter } from 'api/queue.v2/configuration/factories';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { NamespacedDispatcher } from '../NamespacedDispatcher';
import { QueueWorker } from '../QueueWorker';
import { createSignals } from './Signals';
import { NonRetryableJobError } from '../errors';

class TestJob implements Dispatchable {
  static shouldFail = false;

  static shouldFailNonRetryable = false;

  private signal: (index: string) => void;

  private logger: (message: string, index: number) => void;

  constructor(signal: (index: string) => void, logger: (message: string, index: number) => void) {
    this.signal = signal;
    this.logger = logger;
  }

  async handleDispatch(_heartbeat: HeartbeatCallback, params: { aNumber: number }): Promise<void> {
    this.signal(`starting-${params.aNumber}`);
    if (TestJob.shouldFail) {
      throw new Error('Job failed');
    }
    if (TestJob.shouldFailNonRetryable) {
      throw new NonRetryableJobError(new Error('Non retryable error'));
    }
    this.logger(`${params.aNumber}`, params.aNumber);
    this.signal(`ending-${params.aNumber}`);
  }
}

class FailJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(): Promise<void> {
    throw new Error('failing');
  }
}

// eslint-disable-next-line no-empty-function
const setUpWorker = async (onError?: () => void) => {
  const output: string[] = [];
  const signals = createSignals();
  const adapter = DefaultTestingQueueAdapter();
  const logMock = createMockLogger();
  const worker = new QueueWorker('name', adapter, logMock, onError);
  worker.register(
    TestJob,
    async namespace =>
      new TestJob(signals.signal, message => output.push(`${namespace} ${message}`))
  );

  worker.register(FailJob, async () => new FailJob());

  return { worker, output, signals, adapter, logMock };
};

beforeEach(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

it('should process all the jobs', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher1 = new NamespacedDispatcher('namespace1', 'name', adapter);
  const dispatcher2 = new NamespacedDispatcher('namespace2', 'name', adapter);

  const { worker, signals, output } = await setUpWorker();

  await dispatcher1.dispatch(TestJob, { aNumber: 1 });
  await dispatcher2.dispatch(TestJob, { aNumber: 2 });
  await dispatcher1.dispatch(TestJob, { aNumber: 3 });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();

  await dispatcher1.dispatch(TestJob, { aNumber: 4 });
  await dispatcher2.dispatch(TestJob, { aNumber: 5 });
  await dispatcher1.dispatch(TestJob, { aNumber: 6 });

  await signals.signaled('ending-6');
  await worker.stop();

  expect(output).toEqual([
    'namespace1 1',
    'namespace2 2',
    'namespace1 3',
    'namespace1 4',
    'namespace2 5',
    'namespace1 6',
  ]);
});

it('should finish the in-progress job before stopping', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher1 = new NamespacedDispatcher('namespace1', 'name', adapter);
  const dispatcher2 = new NamespacedDispatcher('namespace2', 'name', adapter);

  const { worker, signals, output } = await setUpWorker();

  await dispatcher1.dispatch(TestJob, { aNumber: 1 });
  await dispatcher2.dispatch(TestJob, { aNumber: 2 });
  await dispatcher1.dispatch(TestJob, { aNumber: 3 });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();

  await signals.signaled('starting-2');
  await worker.stop();

  expect(output).toEqual(['namespace1 1', 'namespace2 2']);
});

it('should retry job when it fails', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher = new NamespacedDispatcher('namespace', 'name', adapter, { lockWindow: 1 });
  const onError = jest.fn();

  const { worker, signals, output } = await setUpWorker(onError);

  await dispatcher.dispatch(TestJob, { aNumber: 1 });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();
  await dispatcher.dispatch(TestJob, { aNumber: 2 });
  await dispatcher.dispatch(TestJob, { aNumber: 3 });

  await signals.signaled('ending-2');
  TestJob.shouldFail = true;
  await signals.signaled('starting-3');
  TestJob.shouldFail = false;
  await signals.signaled('ending-3');
  await worker.stop();

  expect(output).toEqual(['namespace 1', 'namespace 2', 'namespace 3']);
});

it('should have a maximum number of retries', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher = new NamespacedDispatcher('namespace', 'name', adapter, {
    lockWindow: 0,
    maxRetries: 2,
  });

  const { worker, signals } = await setUpWorker();

  await dispatcher.dispatch(TestJob, { aNumber: 1 });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();
  await dispatcher.dispatch(TestJob, { aNumber: 2 });

  await signals.signaled('ending-1');
  TestJob.shouldFail = true;
  await signals.signaled('starting-2', 2);
  await worker.stop();
  TestJob.shouldFail = false;

  expect(await adapter.pickJob('name')).toBeNull();
});

it('should not retry jobs that throw a NonRetryableJobError', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher = new NamespacedDispatcher('namespace', 'name', adapter, { lockWindow: 0 });
  const onError = jest.fn();

  const { worker, signals } = await setUpWorker(onError);

  await dispatcher.dispatch(TestJob, { aNumber: 1 });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();
  await dispatcher.dispatch(TestJob, { aNumber: 2 });

  await signals.signaled('ending-1');
  TestJob.shouldFailNonRetryable = true;
  await signals.signaled('starting-2');
  await worker.stop();
  TestJob.shouldFailNonRetryable = false;

  expect(onError).toHaveBeenCalledWith(
    new NonRetryableJobError(new Error('Non retryable error')),
    expect.objectContaining({ job: expect.objectContaining({ name: TestJob.name, failed: true }) })
  );

  expect(await adapter.pickJob('name')).toBeNull();
});

it('should report error and continue if a job fails', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher = new NamespacedDispatcher('namespace', 'name', adapter);
  const onError = jest.fn();

  const { worker, signals, output } = await setUpWorker(onError);

  await dispatcher.dispatch(TestJob, { aNumber: 1 });
  await dispatcher.dispatch(TestJob, { aNumber: 2 });
  await dispatcher.dispatch(FailJob, undefined);
  await dispatcher.dispatch(TestJob, { aNumber: 3 });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();

  await signals.signaled('ending-3');
  await worker.stop();

  expect(onError).toHaveBeenCalledWith(
    new Error('failing'),
    expect.objectContaining({ job: expect.objectContaining({ name: FailJob.name }) })
  );

  expect(output).toEqual(['namespace 1', 'namespace 2', 'namespace 3']);
});

it('should log errors by default when no onError callback is passed', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher = new NamespacedDispatcher('namespace', 'name', adapter);

  const { worker, signals, output, logMock } = await setUpWorker();

  await dispatcher.dispatch(FailJob, undefined);
  await dispatcher.dispatch(TestJob, { aNumber: 1 });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();
  await signals.signaled('ending-1');
  await worker.stop();

  expect(logMock.error).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ job: expect.objectContaining({ name: FailJob.name }) })
  );

  expect(output).toEqual(['namespace 1']);
});

it('should double the lockWindow time on every retry', async () => {
  const initialLockWindow = 1;
  const maxRetries = 3;
  const dispatcher = new NamespacedDispatcher('namespace', 'name', DefaultTestingQueueAdapter(), {
    lockWindow: initialLockWindow,
    maxRetries,
  });

  const { adapter, worker, signals } = await setUpWorker();
  const lockWindows: number[] = [];

  const originalPickJob = adapter.pickJob.bind(adapter);
  adapter.pickJob = async queueName => {
    const job = await originalPickJob(queueName);
    if (job) {
      lockWindows.push(job.options.lockWindow);
    }
    return job;
  };

  await dispatcher.dispatch(TestJob, { aNumber: 1 });
  TestJob.shouldFail = true;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  worker.start();
  await signals.signaled('starting-1', maxRetries);
  await worker.stop();
  TestJob.shouldFail = false;

  expect(lockWindows).toEqual([initialLockWindow, initialLockWindow * 2, initialLockWindow * 4]);
});
