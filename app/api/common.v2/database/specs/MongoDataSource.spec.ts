import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ClientSession, Collection } from 'mongodb';
import { MongoDataSource } from '../MongoDataSource';
import { MongoTransactionManager } from '../MongoTransactionManager';
import { getClient, getConnection } from '../getConnectionForCurrentTenant';

beforeEach(async () => {
  await testingEnvironment.setUp({
    collection: [],
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

class DataSource extends MongoDataSource<{ data: string }> {
  protected collectionName = 'collection';

  async do() {
    await this.getCollection().insertOne({ data: 'some data' });
  }

  withCollection<T>(cb: (c: Collection<{ data: string }>) => T) {
    return cb(this.getCollection());
  }
}

describe('session scoped collection', () => {
  it('should automatically include the operations within the active session', async () => {
    const transactionManager1 = new MongoTransactionManager(getClient());
    const dataSource1 = new DataSource(getConnection(), transactionManager1);

    try {
      await transactionManager1.run(async () => {
        await dataSource1.do();
        throw new Error('make it fail');
      });
    } catch (e) {
      expect(e.message).toEqual('make it fail');
      expect(await testingDB.mongodb?.collection('collection').find({}).toArray()).toEqual([]);
    }

    const transactionManager2 = new MongoTransactionManager(getClient());
    const dataSource2 = new DataSource(getConnection(), transactionManager2);

    await transactionManager2.run(async () => {
      await dataSource2.do();
    });

    expect(await testingDB.mongodb?.collection('collection').find({}).toArray()).toEqual([
      { _id: expect.anything(), data: 'some data' },
    ]);
  });

  it('should always return the same proxy', () => {
    const transactionManager = new MongoTransactionManager(getClient());
    const dataSource = new DataSource(getConnection(), transactionManager);

    const instance1 = dataSource.withCollection(collection => collection);
    const instance2 = dataSource.withCollection(collection => collection);

    expect(instance1).toBe(instance2);
  });

  it('should affect all the methods', () => {
    const transactionManager1 = new MongoTransactionManager(getClient());
    const dataSource1 = new DataSource(getConnection(), transactionManager1);

    dataSource1.withCollection(collection => {
      Object.keys(dataSource1).forEach(member => {
        // @ts-ignore
        const collectionMember = collection[member];
        if (typeof collectionMember === 'function') {
          expect(collectionMember.name).toBe('proxiedFunction');
        }
      });
    });
  });

  it('should not affect other members', () => {
    const transactionManager1 = new MongoTransactionManager(getClient());
    const dataSource1 = new DataSource(getConnection(), transactionManager1);
    dataSource1.withCollection(collection => {
      expect(collection.collectionName).toBe('collection');
      expect(collection.dbName).toBe(testingDB.dbName);
      expect(typeof collection.namespace).toBe('string');
    });
  });

  const cases = [
    {
      method: (arg1: any) => [arg1],
      call: (collection: any) => collection.testMethod(),
      expected: (session: ClientSession) => [{ session }],
    },
    {
      method: (arg1: any) => [arg1],
      call: (collection: any) => collection.testMethod({ someOption: false }),
      expected: (session: ClientSession) => [{ someOption: false, session }],
    },
    {
      method: (arg1: any, arg2: any) => [arg1, arg2],
      call: (collection: any) => collection.testMethod(1),
      expected: (session: ClientSession) => [1, { session }],
    },
    {
      method: (arg1: any, arg2: any) => [arg1, arg2],
      call: (collection: any) => collection.testMethod(1, { someOption: false }),
      expected: (session: ClientSession) => [1, { someOption: false, session }],
    },
    {
      method: (arg1: any, arg2: any, arg3: any) => [arg1, arg2, arg3],
      call: (collection: any) => collection.testMethod(1, 2),
      expected: (session: ClientSession) => [1, 2, { session }],
    },
    {
      method: (arg1: any, arg2: any, arg3: any) => [arg1, arg2, arg3],
      call: (collection: any) => collection.testMethod(1, 2, { someOption: false }),
      expected: (session: ClientSession) => [1, 2, { someOption: false, session }],
    },
  ];

  it.each(cases)(
    'should add the session in the last parameter',
    async ({ method, call, expected }) => {
      const transactionManager1 = new MongoTransactionManager(getClient());
      const dataSource1 = new DataSource(getConnection(), transactionManager1);

      const result = await transactionManager1.run(async () =>
        dataSource1.withCollection(async collection => {
          Object.assign(collection, {
            testMethod: method,
          });

          return call(collection);
        })
      );

      expect(result).toEqual(expected(transactionManager1.getSession()!));
    }
  );
});
