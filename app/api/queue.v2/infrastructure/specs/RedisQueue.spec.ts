/* eslint-disable max-statements */
import { MemoryQueueAdapter } from 'api/queue.v2/infrastructure/MemoryQueueAdapter';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { RedisQueue } from '../RedisQueue';

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
    _params: { data: { pieceOfData: string[] }; aNumber: number }
  ): Promise<void> {
    throw new Error('not implemented');
  }
}

it('should enqueue and dequeue a job, including the namespace', async () => {
  const adapter = new MemoryQueueAdapter();
  const queue = new RedisQueue('queue name', adapter, {
    namespace: 'namespace',
  });

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await queue.dispatch(TestJob, params);

  const job = await queue.peek();
  expect(job).toEqual({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
});

it('should return the job only once during the lockWindow', async () => {
  const adapter = new MemoryQueueAdapter();
  const producer = new RedisQueue('queue name', adapter, { namespace: 'namespace' });
  const consumer1 = new RedisQueue('queue name', adapter);
  const consumer2 = new RedisQueue('queue name', adapter);

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await producer.dispatch(TestJob, params);

  const job1 = await consumer1.peek();
  let job2 = await consumer2.peek();
  expect(job1).toEqual({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
  expect(job2).toBe(null);

  await sleep(1000);
  job2 = await consumer2.peek();
  expect(job2).toEqual(job1);
});

it('should refresh the lock if progress is reported', async () => {
  const adapter = new MemoryQueueAdapter();
  const producer = new RedisQueue('queue name', adapter, {
    namespace: 'namespace',
  });
  const consumer1 = new RedisQueue('queue name', adapter);
  const consumer2 = new RedisQueue('queue name', adapter);

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await producer.dispatch(TestJob, params);

  const job1 = await consumer1.peek();
  let job2 = await consumer2.peek();
  expect(job1).toEqual({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
  expect(job2).toBe(null);
  await sleep(900); //Emulates doing some work
  await consumer1.progress(job1!);
  job2 = await consumer2.peek();
  expect(job2).toBe(null);
  await sleep(1100);
  job2 = await consumer2.peek();
  expect(job2).toEqual(job1);
});

it('should delete a message if marked as completed', async () => {
  const adapter = new MemoryQueueAdapter();
  const queue = new RedisQueue('queue name', adapter, {
    namespace: 'namespace',
  });

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await queue.dispatch(TestJob, params);
  const job = await queue.peek();
  expect(job).toEqual({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
  await queue.complete(job!);
  await sleep(1000); // await for the lockWindow to expire

  const job2 = await queue.peek();
  expect(job2).toBe(null);
});
