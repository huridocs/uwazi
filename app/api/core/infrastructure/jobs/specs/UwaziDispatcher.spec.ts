import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import {
  Dispatchable,
  HeartbeatCallback,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DefaultTestingQueueAdapter } from '#api/core/libs/queue/configuration/factories.js';
import { MongoQueueAdapter } from '#api/core/libs/queue/infrastructure/MongoQueueAdapter.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UwaziDispatcher } from '../UwaziDispatcher.js';

class TestJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params: { someParam: string; userId?: string; correlationId?: string; sessionId?: string }
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

describe('UwaziDispatcher', () => {
  it('should inject userId and correlationId into dispatched job params', async () => {
    const dispatcher = new UwaziDispatcher({
      namespace: 'namespace',
      queueName: 'queue name',
      adapter,
      userId: 'user-1',
      correlationId: 'corr-1',
    });

    await dispatcher.dispatch(TestJob, { someParam: 'x' });

    const job = await adapter.pickJob('queue name');
    expect(job?.params).toEqual({ someParam: 'x', userId: 'user-1', correlationId: 'corr-1' });
  });

  it('should keep an explicit userId and still add the correlationId', async () => {
    const dispatcher = new UwaziDispatcher({
      namespace: 'namespace',
      queueName: 'queue name',
      adapter,
      userId: 'user-1',
      correlationId: 'corr-1',
    });

    await dispatcher.dispatch(TestJob, { someParam: 'x', userId: 'explicit-user' });

    const job = await adapter.pickJob('queue name');
    expect(job?.params).toEqual({
      someParam: 'x',
      userId: 'explicit-user',
      correlationId: 'corr-1',
    });
  });

  it('should not add a correlationId when none was injected', async () => {
    const dispatcher = new UwaziDispatcher({
      namespace: 'namespace',
      queueName: 'queue name',
      adapter,
      userId: 'user-1',
    });

    await dispatcher.dispatch(TestJob, { someParam: 'x' });

    const job = await adapter.pickJob('queue name');
    expect(job?.params).toEqual({ someParam: 'x', userId: 'user-1' });
  });

  it('should inject userId and correlationId into every job of a dispatchMany batch', async () => {
    const dispatcher = new UwaziDispatcher({
      namespace: 'namespace',
      queueName: 'batch-queue',
      adapter,
      userId: 'user-1',
      correlationId: 'corr-1',
    });

    await dispatcher.dispatchMany(async dispatch => {
      dispatch(TestJob, { someParam: 'x' });
      dispatch(TestJob, { someParam: 'y' });
    });

    const first = await adapter.pickJob('batch-queue');
    const second = await adapter.pickJob('batch-queue');

    expect(first?.params).toEqual({ someParam: 'x', userId: 'user-1', correlationId: 'corr-1' });
    expect(second?.params).toEqual({ someParam: 'y', userId: 'user-1', correlationId: 'corr-1' });
  });

  it('should inject the sessionId into dispatch and dispatchMany job params', async () => {
    const dispatcher = new UwaziDispatcher({
      namespace: 'namespace',
      queueName: 'session-queue',
      adapter,
      userId: 'user-1',
      sessionId: 'session-1',
    });

    await dispatcher.dispatch(TestJob, { someParam: 'x' });
    await dispatcher.dispatchMany(async dispatch => {
      dispatch(TestJob, { someParam: 'y' });
    });

    const first = await adapter.pickJob('session-queue');
    const second = await adapter.pickJob('session-queue');

    expect(first?.params).toEqual({ someParam: 'x', userId: 'user-1', sessionId: 'session-1' });
    expect(second?.params).toEqual({ someParam: 'y', userId: 'user-1', sessionId: 'session-1' });
  });

  it('should keep an explicit sessionId', async () => {
    const dispatcher = new UwaziDispatcher({
      namespace: 'namespace',
      queueName: 'queue name',
      adapter,
      userId: 'user-1',
      sessionId: 'session-1',
    });

    await dispatcher.dispatch(TestJob, { someParam: 'x', sessionId: 'explicit-session' });

    const job = await adapter.pickJob('queue name');
    expect(job?.params).toEqual({
      someParam: 'x',
      userId: 'user-1',
      sessionId: 'explicit-session',
    });
  });

  it('should carry the execution context sessionId into dispatched job params', async () => {
    await testingEnvironment.runWithContext(
      async () => ExecutionContext.jobsDispatcher.dispatch(TestJob, { someParam: 'x' }),
      { sessionId: 'session-1' }
    );

    const job = await adapter.pickJob(config.queueName);
    expect(job?.params).toMatchObject({ someParam: 'x', sessionId: 'session-1' });
  });

  it('should carry the execution context correlationId into dispatched job params', async () => {
    await testingEnvironment.runWithContext(
      async () => ExecutionContext.jobsDispatcher.dispatch(TestJob, { someParam: 'x' }),
      { correlationId: 'corr-1' }
    );

    const job = await adapter.pickJob(config.queueName);
    expect(job?.params).toMatchObject({
      someParam: 'x',
      userId: expect.any(String),
      correlationId: 'corr-1',
    });
  });
});
