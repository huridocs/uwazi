/* eslint-disable no-void */
/* eslint-disable max-classes-per-file */
import { Job } from 'api/queue/contracts/Job';
import { MemoryQueueAdapter } from 'api/queue/infrastructure/MemoryQueueAdapter';
import { StringJobSerializer } from 'api/queue/infrastructure/StringJobSerializer';
import { Queue } from '../Queue';
import { QueueWorker } from '../QueueWorker';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class TestJob extends Job {
  private data: { pieceOfData: string[] };

  private aNumber: number;

  logger?: (message: string) => void;

  constructor(data: { pieceOfData: string[] }, aNumber: number, lockWindow: number) {
    super();
    this.data = data;
    this.aNumber = aNumber;
    this.lockWindow = lockWindow;
  }

  private somePrivateMethod() {
    if (this.logger) {
      return this.logger(`${this.aNumber}, ${this.data.pieceOfData.join('|')}`);
    }

    throw new Error('missing logger dependency');
  }

  async handle(): Promise<void> {
    await sleep(1000);
    this.somePrivateMethod();
  }
}

it('should process all the jobs', done => {
  const output: string[] = [];
  const adapter = new MemoryQueueAdapter();
  const producerQueue1 = new Queue('name', adapter, StringJobSerializer, {
    namespace: 'namespace1',
  });
  const producerQueue2 = new Queue('name', adapter, StringJobSerializer, {
    namespace: 'namespace1',
  });
  const consumerQueue = new Queue('name', adapter, StringJobSerializer);

  consumerQueue.register(TestJob, async ns => ({
    logger: async (message: string) => {
      output.push(`${ns} ${message}`);
    },
  }));

  const worker = new QueueWorker(consumerQueue);

  const dispatch = async (job: Job, i: number) =>
    i % 2 ? producerQueue1.dispatch(job) : producerQueue2.dispatch(job);

  Promise.all(
    [
      new TestJob({ pieceOfData: ['.'] }, 1, 1),
      new TestJob({ pieceOfData: ['.', '.'] }, 2, 1),
      new TestJob({ pieceOfData: ['.', '.', '.'] }, 3, 1),
    ].map(dispatch)
  )
    .then(() => {
      output.push('finished enqueueing jobs pre worker.start');
      worker.start().then(done).catch(done.fail);
      Promise.all(
        [
          new TestJob({ pieceOfData: ['.', '.', '.', '.'] }, 4, 1),
          new TestJob({ pieceOfData: ['.', '.', '.', '.', '.'] }, 5, 1),
          new TestJob({ pieceOfData: ['.', '.', '.', '.', '.', '.'] }, 6, 1),
        ].map(dispatch)
      )
        .then(() => {
          output.push('finished enqueueing jobs post worker.start');
          sleep(6 * 1000)
            .then(() => {
              worker
                .stop()
                .then(() => {
                  output.push('worker stopped');

                  expect(output).toEqual([
                    'finished enqueueing jobs pre worker.start',
                    'finished enqueueing jobs post worker.start',
                    'namespace1 1, .',
                    'namespace1 2, .|.',
                    'namespace1 3, .|.|.',
                    'namespace1 4, .|.|.|.',
                    'namespace1 5, .|.|.|.|.',
                    'namespace1 6, .|.|.|.|.|.',
                    'worker stopped',
                  ]);
                })
                .catch(done.fail);
            })
            .catch(done.fail);
        })
        .catch(done.fail);
    })
    .catch(done.fail);
}, 10000);

it('should finish the in-progress job before stopping', done => {
  const output: string[] = [];
  const adapter = new MemoryQueueAdapter();
  const producerQueue1 = new Queue('name', adapter, StringJobSerializer, {
    namespace: 'namespace1',
  });
  const producerQueue2 = new Queue('name', adapter, StringJobSerializer, {
    namespace: 'namespace1',
  });
  const consumerQueue = new Queue('name', adapter, StringJobSerializer);

  consumerQueue.register(TestJob, async ns => ({
    logger: async (message: string) => {
      output.push(`${ns} ${message}`);
    },
  }));

  const worker = new QueueWorker(consumerQueue);

  const dispatch = async (job: Job, i: number) =>
    i % 2 ? producerQueue1.dispatch(job) : producerQueue2.dispatch(job);

  Promise.all(
    [
      new TestJob({ pieceOfData: ['.'] }, 1, 1),
      new TestJob({ pieceOfData: ['.', '.'] }, 2, 1),
      new TestJob({ pieceOfData: ['.', '.', '.'] }, 3, 1),
    ].map(dispatch)
  )
    .then(() => {
      output.push('finished enqueueing jobs pre worker.start');
      worker.start().then(done).catch(done.fail);
      Promise.all(
        [
          new TestJob({ pieceOfData: ['.', '.', '.', '.'] }, 4, 1),
          new TestJob({ pieceOfData: ['.', '.', '.', '.', '.'] }, 5, 1),
          new TestJob({ pieceOfData: ['.', '.', '.', '.', '.', '.'] }, 6, 1),
        ].map(dispatch)
      )
        .then(() => {
          output.push('finished enqueueing jobs post worker.start');
          sleep(3 * 1000 + 300)
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
                    'namespace1 2, .|.',
                    'namespace1 3, .|.|.',
                    'stopping worker',
                    'namespace1 4, .|.|.|.',
                    'worker stopped',
                  ]);
                })
                .catch(done.fail);
            })
            .catch(done.fail);
        })
        .catch(done.fail);
    })
    .catch(done.fail);
}, 10000);
