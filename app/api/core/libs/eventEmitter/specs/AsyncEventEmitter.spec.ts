/* eslint-disable class-methods-use-this */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { tenants } from '#api/tenants/index.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { Collection } from 'mongodb';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { AsyncEventEmitter } from '#api/core/libs/eventEmitter/AsyncEventEmitter.js';
import { Event } from '#api/core/libs/eventEmitter/Event.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { EventEmitter } from '#api/core/libs/eventEmitter/EventEmitter.js';

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);

  const idGenerator = TestUtils.mockClass<IdGenerator>({});
  const eventEmitter = TestUtils.mockClass<EventEmitter>({});

  const sut = new AsyncEventEmitter();

  const runInContext = async (callback: () => Promise<void>, transactional = true) =>
    DependenciesContext.run(
      {
        transactionManager,
        jobsDispatcher,
        eventEmitter,
        idGenerator,
      },
      async () => (transactional ? transactionManager.run(callback) : callback())
    );

  return { sut, runInContext };
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
    jobsCollection = getSharedConnection().collection('jobs');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({});
    await jobsCollection.deleteMany({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should emit event', async () => {
    const { sut, runInContext } = createSut();

    sut.listen(ListenerA1);
    sut.listen(ListenerA2);
    sut.listen(ListenerB);

    const eventA = new EventA({ data: 'some data', tenantName: 'tenant', userId: 'user' });

    await runInContext(async () => sut.emit(eventA));

    const jobs = await getJobs();

    expect(jobs).toMatchObject([
      {
        name: 'EventA:ListenerA1',
        params: { data: 'some data', tenantName: 'tenant', userId: 'user' },
      },
      {
        name: 'EventA:ListenerA2',
        params: { data: 'some data', tenantName: 'tenant', userId: 'user' },
      },
    ]);
  });

  it('should throw when there are no listeners registered for the event', async () => {
    const { sut, runInContext } = createSut();

    const eventA = new EventA({ data: 'some data', tenantName: 'tenant', userId: 'user' });

    const promise = runInContext(async () => sut.emit(eventA));

    await expect(promise).rejects.toThrow();
  });

  it('should throw when emitting outside of a transaction', async () => {
    const { sut, runInContext } = createSut();

    sut.listen(ListenerA1);

    const eventA = new EventA({ data: 'some data', tenantName: 'tenant', userId: 'user' });

    await expect(runInContext(async () => sut.emit(eventA), false)).rejects.toThrow(
      'Cannot emit events outside of a transaction'
    );
  });

  it('should throw when listener is already registered', () => {
    const { sut } = createSut();

    sut.listen(ListenerA1);

    expect(() => sut.listen(ListenerA1)).toThrow(
      'Listener with name ListenerA1 is already registered for event EventA'
    );
  });
});
