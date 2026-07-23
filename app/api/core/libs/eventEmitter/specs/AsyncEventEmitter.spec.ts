/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Collection } from 'mongodb';

import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { tenants } from '#api/tenants/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { JobInfo } from '../../queue/application/contracts/Dispatchable.js';
import {
  DefaultDispatcher,
  DefaultTestingQueueAdapter,
} from '../../queue/configuration/factories.js';
import { Event } from '../Event.js';
import { EventEmitterFactory } from '../EventEmitterFactory.js';
import { EventListenerRegistry } from '../EventListenerRegistry.js';
import { Listener } from '../Listener.js';

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const registry = new EventListenerRegistry();
  const jobsDispatcher = DefaultDispatcher(
    tenants.current().name,
    transactionManager,
    undefined,
    DefaultTestingQueueAdapter(transactionManager)
  );

  const sut = testingEnvironment.runWithContext(() => EventEmitterFactory.default({ registry }), {
    factories: {
      transactionManager: () => transactionManager,
      jobsDispatcher: () => jobsDispatcher,
    },
  });

  const runInTransaction = async (callback: () => Promise<void>) =>
    transactionManager.run(callback);

  return { sut, registry, runInTransaction };
};

type PayloadA = {
  data: string;
};

type PayloadB = {
  text: string;
};

class EventA extends Event<PayloadA> {}

class EventB extends Event<PayloadB> {}

class ListenerA1 extends Listener<EventA> {
  static readonly eventName = EventA.name;

  protected async handle(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class ListenerA2 extends Listener<EventA> {
  static readonly eventName = EventA.name;

  protected async handle(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class ListenerB extends Listener<EventB> {
  static readonly eventName = EventB.name;

  protected async handle(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

describe('AsyncEventEmitter', () => {
  let jobsCollection: Collection;

  const getJobs = async () => jobsCollection.find<JobInfo>({}).toArray();

  beforeAll(async () => {
    await testingEnvironment.setUp({});
    jobsCollection = getConnection().collection('jobs');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({});
    await jobsCollection.deleteMany({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should emit event', async () => {
    const { sut, registry, runInTransaction } = createSut();

    registry.register(ListenerA1);
    registry.register(ListenerA2);
    registry.register(ListenerB);

    const eventA = new EventA({ data: 'some data', userId: 'user' });

    await runInTransaction(async () => sut.emit(eventA));

    const jobs = await getJobs();

    expect(jobs).toMatchObject([
      {
        name: 'EventA:ListenerA1',
        params: { data: 'some data', userId: 'user' },
      },
      {
        name: 'EventA:ListenerA2',
        params: { data: 'some data', userId: 'user' },
      },
    ]);
  });

  it('should no-op when there are no listeners registered for the event', async () => {
    const { sut, runInTransaction } = createSut();

    const eventA = new EventA({ data: 'some data', userId: 'user' });

    await expect(runInTransaction(async () => sut.emit(eventA))).resolves.not.toThrow();
    expect(await getJobs()).toEqual([]);
  });

  it('should throw when emitting outside of a transaction', async () => {
    const { sut, registry } = createSut();

    registry.register(ListenerA1);

    const eventA = new EventA({ data: 'some data', userId: 'user' });

    await expect(sut.emit(eventA)).rejects.toThrow('Cannot emit events outside of a transaction');
  });

  it('should throw when listener is already registered', () => {
    const { registry } = createSut();

    registry.register(ListenerA1);

    expect(() => registry.register(ListenerA1)).toThrow(
      'Listener with name ListenerA1 is already registered for event EventA'
    );
  });
});
