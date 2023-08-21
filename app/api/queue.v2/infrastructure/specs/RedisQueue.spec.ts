/* eslint-disable max-statements */
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoQueueAdapter } from '../MongoQueueAdapter';
import { Queue } from '../Queue';

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
    _params: { data: { pieceOfData: string[] }; aNumber: number }
  ): Promise<void> {
    throw new Error('not implemented');
  }
}

beforeEach(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

it('should enqueue and dequeue a job, including the namespace', async () => {
  const adapter = createAdapter();
  const queue = new Queue('queue name', adapter, {
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
  const adapter = createAdapter();
  const producer = new Queue('queue name', adapter, { namespace: 'namespace' });
  const consumer1 = new Queue('queue name', adapter);
  const consumer2 = new Queue('queue name', adapter);

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
  const adapter = createAdapter();
  const producer = new Queue('queue name', adapter, {
    namespace: 'namespace',
  });
  const consumer1 = new Queue('queue name', adapter);
  const consumer2 = new Queue('queue name', adapter);

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
  const adapter = createAdapter();
  const queue = new Queue('queue name', adapter, {
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
