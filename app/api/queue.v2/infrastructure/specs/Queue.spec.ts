import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTestingQueueAdapter } from 'api/queue.v2/configuration/factories';
import { Queue } from '../Queue';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class TestJob implements Dispatchable {
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

it('should throw an error if trying to dispatch without namespace', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const queue = new Queue('queue name', adapter);

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };

  const result = queue.dispatch(TestJob, params);
  await expect(result).rejects.toBeInstanceOf(Error);
  await expect(result).rejects.toMatchObject({ message: expect.stringContaining('namespace') });
});

it('should enqueue and dequeue a job, including the namespace', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const queue = new Queue('queue name', adapter, {
    namespace: 'namespace',
  });

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await queue.dispatch(TestJob, params);

  const job = await queue.peek();
  expect(job).toMatchObject({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
});

it('should refresh the lock if progress is reported', async () => {
  let NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);
  const adapter = DefaultTestingQueueAdapter();
  const producer = new Queue('queue name', adapter, {
    namespace: 'namespace',
  });
  const consumer1 = new Queue('queue name', adapter);
  const consumer2 = new Queue('queue name', adapter);

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await producer.dispatch(TestJob, params);

  const job1 = await consumer1.peek();
  let job2 = await consumer2.peek();
  expect(job1).toMatchObject({
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
  NOW_VALUE = 1100;
  job2 = await consumer2.peek();
  expect(job2).toEqual({ ...job1, lockedUntil: NOW_VALUE + job1!.options.lockWindow });
});

it('should delete a message if marked as completed', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const queue = new Queue('queue name', adapter, {
    namespace: 'namespace',
  });

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await queue.dispatch(TestJob, params);
  const job = await queue.peek();
  expect(job).toMatchObject({
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
