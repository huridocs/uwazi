/* eslint-disable max-statements */
import { getIdMapper } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { BulkWriteStream } from '../BulkWriteStream';
import { getClient, getConnection } from '../getConnectionForCurrentTenant';
import { MongoDataSource } from '../MongoDataSource';
import { MongoTransactionManager } from '../MongoTransactionManager';

const idMapper = getIdMapper();

const blankState = [
  {
    _id: idMapper('update log 1'),
    data: 'some old data',
  },
];

const updateLogsBlankState = [
  {
    _id: new ObjectId(),
    timestamp: 123,
    namespace: 'collection',
    mongoId: idMapper('update log 1'),
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
          if (e.message !== 'make it fail') {
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
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1);
    });
    const casesForUpdates = [
      {
        method: 'insertOne',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ _id: idMapper('some_data'), data: 'some data' });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          ...updateLogsBlankState,
          {
            _id: expect.anything(),
            timestamp: 1,
            namespace: 'collection',
            mongoId: idMapper('some_data'),
            deleted: false,
          },
        ],
      },
      {
        method: 'insertMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: idMapper('data 1'), data: 'data 1' },
            { _id: idMapper('data 2'), data: 'data 2' },
          ]);
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          ...updateLogsBlankState,
          {
            _id: expect.anything(),
            timestamp: 1,
            namespace: 'collection',
            mongoId: idMapper('data 1'),
            deleted: false,
          },
          {
            _id: expect.anything(),
            timestamp: 1,
            namespace: 'collection',
            mongoId: idMapper('data 2'),
            deleted: false,
          },
        ],
      },
      {
        method: 'updateOne',
        callback: async (ds: DataSource) => {
          await ds
            .collection()
            .updateOne(
              { _id: idMapper('this id does not exists') },
              { $set: { data: 'updated data' } }
            );
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: updateLogsBlankState,
      },
      {
        method: 'updateOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .updateOne({ _id: idMapper('update log 1') }, { $set: { data: 'updated data' } });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            timestamp: 2,
          },
        ],
      },
      {
        method: 'replaceOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .replaceOne({ _id: idMapper('update log 1') }, { data: 'replaced document' });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            timestamp: 2,
          },
        ],
      },
      {
        method: 'findOneAndUpdate',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .findOneAndUpdate(
              { _id: idMapper('update log 1') },
              { $set: { data: 'updated data' } }
            );
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            timestamp: 2,
          },
        ],
      },
      {
        method: 'findOneAndReplace',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .findOneAndReplace({ _id: idMapper('update log 1') }, { data: 'updated data' });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            timestamp: 2,
          },
        ],
      },
      {
        method: 'updateMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: idMapper('data 1'), data: 'data 1' },
            { _id: idMapper('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().updateMany({}, { $set: { data: 'updated data' } });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            timestamp: 2,
          },
          {
            _id: expect.anything(),
            timestamp: 2,
            namespace: 'collection',
            mongoId: idMapper('data 1'),
            deleted: false,
          },
          {
            _id: expect.anything(),
            timestamp: 2,
            namespace: 'collection',
            mongoId: idMapper('data 2'),
            deleted: false,
          },
        ],
      },
      {
        method: 'updateMany',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .updateMany({ property: 'does not exist' }, { $set: { data: 'updated data' } });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: updateLogsBlankState,
      },
      {
        method: 'deleteOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().deleteOne({ _id: idMapper('update log 1') });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            deleted: true,
            timestamp: 2,
          },
        ],
      },
      {
        method: 'deleteMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ _id: idMapper('data 1'), data: 'data 1' });
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .deleteMany({ _id: { $in: [idMapper('update log 1'), idMapper('data 1')] } });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            deleted: true,
            timestamp: 2,
          },
          {
            _id: expect.anything(),
            timestamp: 2,
            namespace: 'collection',
            mongoId: idMapper('data 1'),
            deleted: true,
          },
        ],
      },
      {
        method: 'findOneAndDelete',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().findOneAndDelete({ _id: idMapper('update log 1') });
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          {
            ...updateLogsBlankState[0],
            deleted: true,
            timestamp: 2,
          },
        ],
      },
      {
        method: 'bulkWrite (insert)',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          const stream = new BulkWriteStream(ds.collection());
          await stream.insert({ _id: idMapper('insert one'), data: 'insert one' });
          await stream.insertMany([
            { _id: idMapper('insert many 1'), data: 'insert many 1' },
            { _id: idMapper('insert many 2'), data: 'insert many 1' },
          ]);
          await stream.flush();
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [
          ...updateLogsBlankState,
          {
            _id: expect.anything(),
            timestamp: 2,
            namespace: 'collection',
            mongoId: idMapper('insert one'),
            deleted: false,
          },
          {
            _id: expect.anything(),
            timestamp: 2,
            namespace: 'collection',
            mongoId: idMapper('insert many 1'),
            deleted: false,
          },
          {
            _id: expect.anything(),
            timestamp: 2,
            namespace: 'collection',
            mongoId: idMapper('insert many 2'),
            deleted: false,
          },
        ],
      },
      {
        method: 'bulkWrite (delete)',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().insertMany([
            { _id: idMapper('data 1'), data: 'data 1' },
            { _id: idMapper('data 2'), data: 'data 2' },
          ]);
          const stream = new BulkWriteStream(ds.collection());
          await stream.delete({ _id: idMapper('update log 1') });
          await stream.deleteMany({ _id: { $in: [idMapper('data 1'), idMapper('data 2')] } });
          await stream.flush();
        },
        expectedOnAbort: updateLogsBlankState,
        expectedOnSuccess: [],
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
          if (e.message !== 'make it fail') {
            throw e;
          }
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
