/* eslint-disable max-statements */
import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { MongoDataSource } from '../MongoDataSource';
import { MongoTransactionManager } from '../MongoTransactionManager';
import { getClient, getConnection } from '../getConnectionForCurrentTenant';

const blankState = [
  {
    _id: new ObjectId(),
    data: 'some old data',
  },
];

const updateLogsBlankState = [
  {
    _id: new ObjectId(),
    timestamp: 123,
    namespace: 'namespace',
    mongoId: 'mongoid',
    deleted: false,
  },
];

beforeEach(async () => {
  await testingEnvironment.setUp({
    collection: blankState,
    updatelogs: updateLogsBlankState,
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

class DataSource extends MongoDataSource<{ data: string }> {
  protected collectionName = 'collection';

  collection() {
    return this.getCollection();
  }
}

describe('session scoped collection', () => {
  describe('should automatically include the operations in the active session', () => {
    const casesForUpdates = [
      {
        method: 'insertOne',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ data: 'some data' });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [...blankState, { _id: expect.anything(), data: 'some data' }],
      },
      {
        method: 'insertMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([{ data: 'some data' }]);
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [...blankState, { _id: expect.anything(), data: 'some data' }],
      },
      {
        method: 'bulkWrite',
        callback: async (ds: DataSource) => {
          await ds.collection().bulkWrite([{ insertOne: { document: { data: 'some data' } } }]);
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [...blankState, { _id: expect.anything(), data: 'some data' }],
      },
      {
        method: 'updateOne',
        callback: async (ds: DataSource) => {
          await ds
            .collection()
            .updateOne({ _id: blankState[0]._id }, { $set: { data: 'new data' } });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [{ ...blankState[0], data: 'new data' }],
      },
      {
        method: 'replaceOne',
        callback: async (ds: DataSource) => {
          await ds.collection().replaceOne({ _id: blankState[0]._id }, { data: 'new data' });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [{ ...blankState[0], data: 'new data' }],
      },
      {
        method: 'updateMany',
        callback: async (ds: DataSource) => {
          await ds
            .collection()
            .updateMany({ _id: blankState[0]._id }, { $set: { data: 'new data' } });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [{ ...blankState[0], data: 'new data' }],
      },
      {
        method: 'deleteOne',
        callback: async (ds: DataSource) => {
          await ds.collection().deleteOne({ _id: blankState[0]._id });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [],
      },
      {
        method: 'deleteMany',
        callback: async (ds: DataSource) => {
          await ds.collection().deleteMany({ _id: blankState[0]._id });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [],
      },
      {
        method: 'findOneAndDelete',
        callback: async (ds: DataSource) => {
          await ds.collection().findOneAndDelete({ _id: blankState[0]._id });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [],
      },
      {
        method: 'findOneAndReplace',
        callback: async (ds: DataSource) => {
          await ds.collection().findOneAndReplace({ _id: blankState[0]._id }, { data: 'new data' });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [{ ...blankState[0], data: 'new data' }],
      },
      {
        method: 'findOneAndUpdate',
        callback: async (ds: DataSource) => {
          await ds
            .collection()
            .findOneAndUpdate({ _id: blankState[0]._id }, { $set: { data: 'new data' } });
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [{ ...blankState[0], data: 'new data' }],
      },
    ];

    it.each(casesForUpdates)(
      '$method should write changes transactionally',
      async ({ callback, expectedOnAbort, expectedOnSuccess }) => {
        const transactionManager1 = new MongoTransactionManager(getClient());
        const dataSource1 = new DataSource(getConnection(), transactionManager1);

        try {
          await transactionManager1.run(async () => {
            await callback(dataSource1);
            throw new Error('make it fail');
          });
        } catch (e) {
          if(e.message !== 'make it fail') {
            throw e;
          }
          expect(e.message).toEqual('make it fail');
          expect(await testingDB.mongodb?.collection('collection').find({}).toArray()).toEqual(
            expectedOnAbort
          );
        }

        const transactionManager2 = new MongoTransactionManager(getClient());
        const dataSource2 = new DataSource(getConnection(), transactionManager2);

        await transactionManager2.run(async () => {
          await callback(dataSource2);
        });

        expect(await testingDB.mongodb?.collection('collection').find({}).toArray()).toEqual(
          expectedOnSuccess
        );
      }
    );

    const casesForReads = [
      {
        method: 'find',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ data: 'created in transaction' });
          return ds.collection().find({}).toArray();
        },
        expectedInTransaction: [
          ...blankState,
          { _id: expect.anything(), data: 'created in transaction' },
        ],
      },
      {
        method: 'findOne',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ data: 'created in transaction' });
          const result = await ds.collection().findOne({}, { sort: { _id: -1 } });
          return [result];
        },
        expectedInTransaction: [{ _id: expect.anything(), data: 'created in transaction' }],
      },
      {
        method: 'aggregate',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ data: 'created in transaction' });
          return ds
            .collection()
            .aggregate([{ $match: {} }])
            .toArray();
        },
        expectedInTransaction: [
          ...blankState,
          { _id: expect.anything(), data: 'created in transaction' },
        ],
      },
    ];

    it.each(casesForReads)(
      '$method should read data from the transaction',
      async ({ callback, expectedInTransaction }) => {
        const transactionManager1 = new MongoTransactionManager(getClient());
        const dataSource1 = new DataSource(getConnection(), transactionManager1);

        let result;

        try {
          await transactionManager1.run(async () => {
            result = await callback(dataSource1);
            throw new Error('make it fail');
          });
        } catch (e) {
          expect(e.message).toEqual('make it fail');
          expect(result).toEqual(expectedInTransaction);
        }
      }
    );

    const otherCases = [
      {
        method: 'countDocuments',
        callback: async (ds: DataSource) => ds.collection().countDocuments(),
        expectedInTransaction: 2,
        expectedNoTransaction: 1,
      },
      {
        method: 'distinct',
        callback: async (ds: DataSource) => ds.collection().distinct('data'),
        expectedInTransaction: ['created in transaction', 'some old data'],
        expectedNoTransaction: ['some old data'],
      },
    ];

    it.each(otherCases)(
      '$method should return the information according to the transaction state',
      async ({ callback, expectedInTransaction, expectedNoTransaction }) => {
        const transactionManager1 = new MongoTransactionManager(getClient());
        const dataSource1 = new DataSource(getConnection(), transactionManager1);

        let result;

        try {
          await transactionManager1.run(async () => {
            await dataSource1.collection().insertOne({ data: 'created in transaction' });
            result = await callback(dataSource1);
            throw new Error('make it fail');
          });
        } catch (e) {
          expect(e.message).toEqual('make it fail');
          expect(result).toEqual(expectedInTransaction);
        }

        const transactionManager2 = new MongoTransactionManager(getClient());
        const dataSource2 = new DataSource(getConnection(), transactionManager2);

        expect(await callback(dataSource2)).toEqual(expectedNoTransaction);
      }
    );
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

    const allowListed = Object.keys(MongoDataSource.scopedMethods) as Array<
      keyof typeof collection
    >;

    allowListed.forEach(member => {
      const collectionMember = collection[member];
      const optionsArgPos = MongoDataSource.scopedMethods[member];
      if (optionsArgPos !== null) {
        expect(collectionMember).not.toBe(undefined);
        expect(typeof collectionMember).toBe('function');
        expect((<Function>collectionMember).name).toBe('proxiedFunction');
      } else {
        expect(typeof collectionMember).not.toBe('function');
      }
    });
  });
});

describe('collection with automatic log to updatelogs', () => {
  describe('should log creations/updates/deletions on updatelogs collection', () => {
    const casesForUpdates = [
      {
        method: 'insertOne',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ data: 'some data' });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          ...updateLogsBlankState,
          {
            _id: expect.anything(),
            timestamp: expect.anything(),
            namespace: 'collection',
            mongoId: expect.anything(),
            deleted: false,
          },
        ],
      },
      {
        method: 'insertMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([{ data: 'data 1' }, { data: 'data 2' }]);
        },
        expectedOnAbort: blankState,
        expectedOnSuccess: [
          ...updateLogsBlankState,
          {
            _id: expect.anything(),
            timestamp: expect.anything(),
            namespace: 'collection',
            mongoId: expect.anything(),
            deleted: false,
          },
          {
            _id: expect.anything(),
            timestamp: expect.anything(),
            namespace: 'collection',
            mongoId: expect.anything(),
            deleted: false,
          },
        ],
      },
    ];

    it.each(casesForUpdates)(
      '$method should log changes to updatelogs',
      async ({ callback, expectedOnAbort, expectedOnSuccess }) => {
        const transactionManager1 = new MongoTransactionManager(getClient());
        const dataSource1 = new DataSource(getConnection(), transactionManager1);

        try {
          await transactionManager1.run(async () => {
            await callback(dataSource1);
            throw new Error('make it fail');
          });
        } catch (e) {
          expect(e.message).toEqual('make it fail');
          expect(await testingDB.mongodb?.collection('updatelogs').find({}).toArray()).toEqual(
            expectedOnAbort
          );
        }

        const transactionManager2 = new MongoTransactionManager(getClient());
        const dataSource2 = new DataSource(getConnection(), transactionManager2);

        await transactionManager2.run(async () => {
          await callback(dataSource2);
        });

        expect(await testingDB.mongodb?.collection('updatelogs').find({}).toArray()).toEqual(
          expectedOnSuccess
        );
      }
    );
  });
});
