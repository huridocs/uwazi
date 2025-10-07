import {
  Dispatchable,
  HeartbeatCallback,
} from 'api/core/libs/queue/application/contracts/Dispatchable';
import { DefaultTestingQueueAdapter } from 'api/core/libs/queue/configuration/factories';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoQueueAdapter } from '../MongoQueueAdapter';
import { NamespacedDispatcher } from '../NamespacedDispatcher';

class TestJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params: { data: { pieceOfData: string[] }; aNumber: number }
  ): Promise<void> {
    throw new Error('not implemented');
  }
}

let adapter: MongoQueueAdapter;

beforeEach(async () => {
  await testingEnvironment.setUp({});
  adapter = DefaultTestingQueueAdapter();
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('dispatch', () => {
  it('should enqueue and dequeue a job, including the namespace', async () => {
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
});

describe('dispatchMany', () => {
  it('should batch dispatch multiple jobs efficiently', async () => {
    const dispatcher = new NamespacedDispatcher('namespace', 'batch-queue', adapter);

    const job1Params = { data: { pieceOfData: ['x', 'y'] }, aNumber: 1 };
    const job2Params = { data: { pieceOfData: ['z', 'w'] }, aNumber: 2 };

    await dispatcher.dispatchMany(async dispatch => {
      await new Promise(resolve => {
        setTimeout(resolve, 1);
      });

      dispatch(TestJob, job1Params);
      dispatch(TestJob, job2Params);
    });

    const job1 = await adapter.pickJob('batch-queue');
    const job2 = await adapter.pickJob('batch-queue');
    const noMoreJobs = await adapter.pickJob('batch-queue');

    expect(job1).toMatchObject({
      id: expect.any(String),
      name: TestJob.name,
      params: job1Params,
      namespace: 'namespace',
    });

    expect(job2).toMatchObject({
      id: expect.any(String),
      name: TestJob.name,
      params: job2Params,
      namespace: 'namespace',
    });

    expect(noMoreJobs).toBe(null);
  });
});
