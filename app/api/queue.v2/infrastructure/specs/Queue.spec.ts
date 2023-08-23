import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTestingQueueAdapter } from 'api/queue.v2/configuration/factories';
import { Queue } from '../Queue';

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

  const job = await adapter.pickJob('queue name');
  expect(job).toMatchObject({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
});
