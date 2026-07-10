import {
  Dispatchable,
  HeartbeatCallback,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DefaultTestingQueueAdapter } from '#api/core/libs/queue/configuration/factories.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { JobDBO, MongoQueueAdapter } from '../MongoQueueAdapter.js';
import { NamespacedDispatcher } from '../NamespacedDispatcher.js';

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

  it('should enqueue a job with future lockedUntil that is not pickable immediately', async () => {
    const dispatcher = new NamespacedDispatcher('namespace', 'queue name', adapter);
    let NOW_VALUE = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);

    const params = { data: { pieceOfData: ['a'] }, aNumber: 1 };
    await dispatcher.dispatch(TestJob, params, { lockedUntil: NOW_VALUE + 10_000 });

    const notYetPickable = await adapter.pickJob('queue name');
    expect(notYetPickable).toBe(null);

    NOW_VALUE = 11_001;
    const job = await adapter.pickJob('queue name');
    expect(job).toMatchObject({
      name: TestJob.name,
      params,
      namespace: 'namespace',
    });
  });

  it('should enqueue a job pickable immediately when no dispatch options are passed', async () => {
    const dispatcher = new NamespacedDispatcher('namespace', 'queue name', adapter);

    const params = { data: { pieceOfData: ['a'] }, aNumber: 1 };
    await dispatcher.dispatch(TestJob, params);

    const job = await adapter.pickJob('queue name');
    expect(job).toMatchObject({
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

  describe('deleteByParams', () => {
    const factory = getFixturesFactory();

    beforeEach(async () => {
      await testingEnvironment.setFixtures({
        jobs: [
          {
            _id: factory.id('job1_1'),
            namespace: 'namespace_1',
            queue: 'queue1',
            name: 'TestJob',
            params: { aNumber: 1 },
          },
          {
            _id: factory.id('job1_3'),
            namespace: 'namespace_1',
            queue: 'queue1',
            name: 'TestJob',
            params: { aNumber: 1 },
            lockedUntil: Date.now() + 10000,
          },
          {
            _id: factory.id('job1_2'),
            namespace: 'namespace_2',
            queue: 'queue1',
            name: 'TestJob',
            params: { aNumber: 1 },
          },
        ] as JobDBO[],
      });
    });

    it('should delete by params only on the specified namespace', async () => {
      const dispatcher = new NamespacedDispatcher('namespace_1', 'queue name', adapter);

      await dispatcher.deleteByParams(TestJob, { aNumber: 1 });

      const job = await testingEnvironment.db.getAllFrom('jobs');

      expect(job).toEqual(
        TestUtils.arrayIncludesObjects([
          { _id: factory.id('job1_2') },
          {
            _id: factory.id('job1_3'),
          },
        ])
      );
    });

    it('should count jobs by name only on the specified namespace', async () => {
      const dispatcherNamespace1 = new NamespacedDispatcher('namespace_1', 'queue name', adapter);
      const dispatcherNamespace2 = new NamespacedDispatcher('namespace_2', 'queue name', adapter);

      expect(await dispatcherNamespace1.countByName(TestJob)).toBe(2);
      expect(await dispatcherNamespace2.countByName(TestJob)).toBe(1);
      class OtherJob implements Dispatchable {
        // eslint-disable-next-line class-methods-use-this
        async handleDispatch(): Promise<void> {}
      }
      expect(await dispatcherNamespace1.countByName(OtherJob)).toBe(0);
    });
  });
});
