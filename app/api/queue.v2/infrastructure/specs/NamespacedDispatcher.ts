import { Dispatchable, HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { DefaultTestingQueueAdapter } from '#api/core/libs/queue/configuration/factories.js';
import { NamespacedDispatcher } from './NamespacedDispatcher.js';

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

it('should enqueue and dequeue a job, including the namespace', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const dispatcher = new NamespacedDispatcher('namespace', 'queue name', adapter);

  const params = { data: { pieceOfData: ['a', 'b', 'c'] }, aNumber: 2 };
  await dispatcher.dispatch(TestJob, params);

  const job = await adapter.pickJob('queue name');
  expect(job).toMatchObject({
    id: expect.any(String),
    name: TestJob.name,
    params,
    namespace: 'namespace',
  });
});
