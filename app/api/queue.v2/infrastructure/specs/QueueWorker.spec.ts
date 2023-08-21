/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable max-statements */
/* eslint-disable no-void */
/* eslint-disable max-classes-per-file */
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { RedisQueue } from '../RedisQueue';
import { QueueWorker } from '../QueueWorker';
import { MongoQueueAdapter } from '../MongoQueueAdapter';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function createAdapter() {
  return new MongoQueueAdapter(getConnection(), new MongoTransactionManager(getClient()));
}

class TestJob implements Dispatchable {
  private logger: (message: string) => void;

  constructor(logger: (message: string) => void) {
    this.logger = logger;
  }

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    params: { data: { pieceOfData: string[] }; aNumber: number }
  ): Promise<void> {
    await sleep(50);
    this.logger(`${params.aNumber}, ${params.data.pieceOfData.join('|')}`);
  }
}

beforeEach(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

it('should process all the jobs', async () => {
  const output: string[] = [];
  const adapter = createAdapter();
  const producerQueue1 = new RedisQueue('name', adapter, {
    namespace: 'namespace1',
  });
  const producerQueue2 = new RedisQueue('name', adapter, {
    namespace: 'namespace2',
  });
  const consumerQueue = new RedisQueue('name', adapter);

  const worker = new QueueWorker(consumerQueue, () => {});

  worker.register(
    TestJob,
    async namespace => new TestJob(message => output.push(`${namespace} ${message}`))
  );

  const dispatch = async (params: any, i: number) => {
    await sleep(5);
    (i % 2 ? producerQueue2 : producerQueue1).dispatch(TestJob, params);
  };

  await dispatch({ data: { pieceOfData: ['.'] }, aNumber: 1 }, 0);
  await dispatch({ data: { pieceOfData: ['.', '.'] }, aNumber: 2 }, 1);
  await dispatch({ data: { pieceOfData: ['.', '.', '.'] }, aNumber: 3 }, 2);
  output.push('finished enqueueing jobs pre worker.start');
  await sleep(5);
  await Promise.all([
    worker.start(),
    dispatch({ data: { pieceOfData: ['.', '.', '.', '.'] }, aNumber: 4 }, 0)
      .then(
        void dispatch({ data: { pieceOfData: ['.', '.', '.', '.', '.'] }, aNumber: 5 }, 1).then(
          void dispatch({ data: { pieceOfData: ['.', '.', '.', '.', '.', '.'] }, aNumber: 6 }, 2)
        )
      )
      .then(async () => {
        output.push('finished enqueueing jobs post worker.start');
        await sleep(2000);
        await worker.stop();
        output.push('worker stopped');
      }),
  ]);

  expect(output).toEqual([
    'finished enqueueing jobs pre worker.start',
    'finished enqueueing jobs post worker.start',
    'namespace1 1, .',
    'namespace2 2, .|.',
    'namespace1 3, .|.|.',
    'namespace1 4, .|.|.|.',
    'namespace2 5, .|.|.|.|.',
    'namespace1 6, .|.|.|.|.|.',
    'worker stopped',
  ]);
}, 10000);

it('should finish the in-progress job before stopping', async () => {
  const output: string[] = [];
  const adapter = createAdapter();
  const producerQueue1 = new RedisQueue('name', adapter, {
    namespace: 'namespace1',
  });
  const producerQueue2 = new RedisQueue('name', adapter, {
    namespace: 'namespace2',
  });
  const consumerQueue = new RedisQueue('name', adapter);

  const worker = new QueueWorker(consumerQueue, () => {});

  worker.register(
    TestJob,
    async namespace => new TestJob(message => output.push(`${namespace} ${message}`))
  );

  const dispatch = async (params: any, i: number) => {
    await sleep(2);
    return (i % 2 ? producerQueue2 : producerQueue1).dispatch(TestJob, params);
  };

  await dispatch({ data: { pieceOfData: ['.'] }, aNumber: 1 }, 0);
  await dispatch({ data: { pieceOfData: ['.', '.'] }, aNumber: 2 }, 1);
  await dispatch({ data: { pieceOfData: ['.', '.', '.'] }, aNumber: 3 }, 2);

  output.push('finished enqueueing jobs pre worker.start');

  await Promise.all([
    worker.start(),
    dispatch({ data: { pieceOfData: ['.', '.', '.', '.'] }, aNumber: 4 }, 0)
      .then(
        void dispatch({ data: { pieceOfData: ['.', '.', '.', '.', '.'] }, aNumber: 5 }, 1).then(
          void dispatch({ data: { pieceOfData: ['.', '.', '.', '.', '.', '.'] }, aNumber: 6 }, 2)
        )
      )
      .then(async () => {
        output.push('finished enqueueing jobs post worker.start');
        await sleep(4 * 50 + 10);
        output.push('stopping worker');
        await worker.stop();
        output.push('worker stopped');
      }),
  ]);

  expect(output).toEqual([
    'finished enqueueing jobs pre worker.start',
    'finished enqueueing jobs post worker.start',
    'namespace1 1, .',
    'namespace2 2, .|.',
    'namespace1 3, .|.|.',
    'stopping worker',
    'namespace1 4, .|.|.|.',
    'worker stopped',
  ]);
}, 10000);

it('should log and continue if a job fails', async () => {
  class FailOnceJob implements Dispatchable {
    static executions: string[] = [];

    static failed = false;

    // eslint-disable-next-line class-methods-use-this
    async handleDispatch(): Promise<void> {
      if (FailOnceJob.failed) {
        FailOnceJob.executions.push('successful');
        return;
      }

      FailOnceJob.failed = true;
      FailOnceJob.executions.push('failing');
      throw new Error('failing');
    }
  }

  const logMock = jest.fn();

  const adapter = createAdapter();
  const queue = new RedisQueue('name', adapter, { namespace: 'namespace' });
  const queueWorker = new QueueWorker(queue, logMock);

  queueWorker.register(FailOnceJob, async () => new FailOnceJob());

  await queue.dispatch(FailOnceJob, undefined);

  await Promise.all([queueWorker.start(), sleep(1100).then(async () => queueWorker.stop())]);

  expect(FailOnceJob.executions).toEqual(['failing', 'successful']);
  expect(logMock).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({ job: expect.objectContaining({ name: FailOnceJob.name }) })
  );
});
