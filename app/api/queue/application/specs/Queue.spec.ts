/* eslint-disable max-statements */
import { Job } from 'api/queue/contracts/Job';
import { MemoryQueueAdapter } from 'api/queue/infrastructure/MemoryQueueAdapter';
import { StringJobSerializer } from 'api/queue/infrastructure/StringJobSerializer';
import { Queue } from '../Queue';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class TestJob extends Job {
  private data: { pieceOfData: string[] };

  private aNumber: number;

  logger?: (message: string) => void;

  lockWindow = 2;

  constructor(data: { pieceOfData: string[] }, aNumber: number) {
    super();
    this.data = data;
    this.aNumber = aNumber;
  }

  private somePrivateMethod() {
    if (this.logger) {
      return this.logger(`${this.aNumber}, ${this.data.pieceOfData.join('|')}`);
    }

    throw new Error('missing logger dependency');
  }

  async handle(): Promise<void> {
    this.somePrivateMethod();
  }
}

it('should enqueue and dequeue a job, including the namespace and injecting the dependencies', async () => {
  const output: string[] = [];

  const adapter = new MemoryQueueAdapter();
  const serializer = StringJobSerializer;
  const queue = new Queue('queue name', adapter, serializer, {
    namespace: 'namespace',
  });

  queue.register(TestJob, async ns => ({
    logger: (message: string) => {
      output.push(`${ns} ${message}`);
    },
  }));

  await queue.dispatch(new TestJob({ pieceOfData: ['a', 'b', 'c'] }, 2));

  const job = await queue.peek();
  await job?.handle(async () => {});
  expect(output).toEqual(['namespace 2, a|b|c']);
});

it('should return the job only once during the lockWindow', async () => {
  const adapter = new MemoryQueueAdapter();
  const serializer = StringJobSerializer;
  const producer = new Queue('queue name', adapter, serializer);
  const consumer1 = new Queue('queue name', adapter, serializer);
  const consumer2 = new Queue('queue name', adapter, serializer);

  [consumer1, consumer2].forEach(consumer => {
    consumer.register(TestJob);
  });

  await producer.dispatch(new TestJob({ pieceOfData: ['a', 'b', 'c'] }, 2));

  const job1 = await consumer1.peek();
  let job2 = await consumer2.peek();
  expect(job1).toBeInstanceOf(TestJob);
  expect(job2).toBe(null);
  await sleep(1000);
  job2 = await consumer2.peek();
  expect(job2).toBeInstanceOf(TestJob);
});

it('should refresh the lock if progress is reported', async () => {
  const adapter = new MemoryQueueAdapter();
  const serializer = StringJobSerializer;
  const producer = new Queue('queue name', adapter, serializer);
  const consumer1 = new Queue('queue name', adapter, serializer);
  const consumer2 = new Queue('queue name', adapter, serializer);

  [consumer1, consumer2].forEach(consumer => {
    consumer.register(TestJob);
  });

  await producer.dispatch(new TestJob({ pieceOfData: ['a', 'b', 'c'] }, 2));

  const job1 = await consumer1.peek();
  let job2 = await consumer2.peek();
  expect(job1).toBeInstanceOf(TestJob);
  expect(job2).toBe(null);
  await sleep(900); //Emulates doing some work
  await consumer1.progress(job1!);
  job2 = await consumer2.peek();
  expect(job2).toBe(null);
  await sleep(2100);
  job2 = await consumer2.peek();
  expect(job2).toBeInstanceOf(TestJob);
});

it('should delete a message if marked as completed', async () => {
  const adapter = new MemoryQueueAdapter();
  const serializer = StringJobSerializer;
  const queue = new Queue('queue name', adapter, serializer);
  queue.register(TestJob);

  await queue.dispatch(new TestJob({ pieceOfData: ['a', 'b', 'c'] }, 2));
  const job = await queue.peek();
  expect(job).toBeInstanceOf(TestJob);
  await queue.complete(job!);
  await sleep(1000); // await for the lockWindow to expire

  const job2 = await queue.peek();
  expect(job2).toBe(null);
});
