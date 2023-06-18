/* eslint-disable max-statements */
import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
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

  collection() {
    return this.getCollection();
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

  it('should always return the same instance of the collection', () => {
    const transactionManager = new MongoTransactionManager(getClient());
    const dataSource = new DataSource(getConnection(), transactionManager);

    expect(dataSource.collection()).toBe(dataSource.collection());
  });

  it('should only affect the allow-listed functions', () => {
    const transactionManager1 = new MongoTransactionManager(getClient());
    const dataSource1 = new DataSource(getConnection(), transactionManager1);
    const collection = dataSource1.collection();

    const allowListed = MongoDataSource.sessionScopedMethods;
    Object.keys(collection).forEach(member => {
      // @ts-ignore
      const collectionMember = collection[member];
      if (typeof collectionMember === 'function') {
        expect(collectionMember.name).toBe(
          allowListed.includes(member as keyof typeof collection) ? 'proxiedFunction' : member
        );
      }
    });
  });
});
