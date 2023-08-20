/* eslint-disable no-void */
/* eslint-disable max-classes-per-file */
import { MemoryQueueAdapter } from 'api/queue.v2/infrastructure/MemoryQueueAdapter';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { RedisQueue } from '../RedisQueue';
import { QueueWorker } from '../QueueWorker';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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

it('should process all the jobs', done => {
  const output: string[] = [];
  const adapter = new MemoryQueueAdapter();
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

  const dispatch = async (params: any, i: number) =>
    (i % 2 ? producerQueue2 : producerQueue1).dispatch(TestJob, params);

  Promise.all(
    [
      { data: { pieceOfData: ['.'] }, aNumber: 1 },
      { data: { pieceOfData: ['.', '.'] }, aNumber: 2 },
      { data: { pieceOfData: ['.', '.', '.'] }, aNumber: 3 },
    ].map(dispatch)
  )
    .then(() => {
      output.push('finished enqueueing jobs pre worker.start');
      worker.start().then(done).catch(done);
      Promise.all(
        [
          { data: { pieceOfData: ['.', '.', '.', '.'] }, aNumber: 4 },
          { data: { pieceOfData: ['.', '.', '.', '.', '.'] }, aNumber: 5 },
          { data: { pieceOfData: ['.', '.', '.', '.', '.', '.'] }, aNumber: 6 },
        ].map(dispatch)
      )
        .then(() => {
          output.push('finished enqueueing jobs post worker.start');
          sleep(6 * 100)
            .then(() => {
              worker
                .stop()
                .then(() => {
                  output.push('worker stopped');

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
                })
                .catch(done);
            })
            .catch(done);
        })
        .catch(done);
    })
    .catch(done);
}, 10000);

it('should finish the in-progress job before stopping', done => {
  const output: string[] = [];
  const adapter = new MemoryQueueAdapter();
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

  const dispatch = async (params: any, i: number) =>
    (i % 2 ? producerQueue2 : producerQueue1).dispatch(TestJob, params);

  Promise.all(
    [
      { data: { pieceOfData: ['.'] }, aNumber: 1 },
      { data: { pieceOfData: ['.', '.'] }, aNumber: 2 },
      { data: { pieceOfData: ['.', '.', '.'] }, aNumber: 3 },
    ].map(dispatch)
  )
    .then(() => {
      output.push('finished enqueueing jobs pre worker.start');
      worker.start().then(done).catch(done);
      Promise.all(
        [
          { data: { pieceOfData: ['.', '.', '.', '.'] }, aNumber: 4 },
          { data: { pieceOfData: ['.', '.', '.', '.', '.'] }, aNumber: 5 },
          { data: { pieceOfData: ['.', '.', '.', '.', '.', '.'] }, aNumber: 6 },
        ].map(dispatch)
      )
        .then(() => {
          output.push('finished enqueueing jobs post worker.start');
          sleep(3 * 50 + 10)
            .then(() => {
              output.push('stopping worker');
              worker
                .stop()
                .then(() => {
                  output.push('worker stopped');

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
                })
                .catch(done);
            })
            .catch(done);
        })
        .catch(done);
    })
    .catch(done);
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

  const adapter = new MemoryQueueAdapter();
  const queue = new RedisQueue('name', adapter, { namespace: 'namespace' });
  const queueWorker = new QueueWorker(queue, logMock);

  queueWorker.register(FailOnceJob, async () => new FailOnceJob());

  await queue.dispatch(FailOnceJob, undefined);

  await Promise.all([queueWorker.start(), sleep(200).then(async () => queueWorker.stop())]);

  expect(FailOnceJob.executions).toEqual(['failing', 'successful']);
  expect(logMock).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({ job: expect.objectContaining({ name: FailOnceJob.name }) })
  );
});
