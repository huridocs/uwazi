/* eslint-disable max-statements */
import { getIdMapper } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { getClient, getConnection } from '../getConnectionForCurrentTenant';
import { MongoDataSource } from '../MongoDataSource';
import { MongoTransactionManager } from '../MongoTransactionManager';

const id = getIdMapper();

const blankState = [
  {
    _id: id('collection id 1'),
    data: 'some old data',
  },
];

const updateLogsBlankState = [
  {
    _id: new ObjectId(),
    timestamp: 123,
    namespace: 'collection',
    mongoId: id('collection id 1'),
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

const updateLog = (partialUpdateLog: {
  mongoId: ObjectId;
  timestamp?: number;
  deleted?: boolean;
}) => ({
  _id: expect.any(ObjectId),
  timestamp: 1,
  namespace: 'collection',
  deleted: false,
  ...partialUpdateLog,
});

describe('collection with automatic log to updatelogs', () => {
  describe('should log creations/updates/deletions on updatelogs collection', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1);
    });
    const casesForUpdates = [
      {
        method: 'insertOne',
        callback: async (ds: DataSource) =>
          ds.collection().insertOne({ _id: id('some_data'), data: 'some data' }),
        expectedDBState: [...updateLogsBlankState, updateLog({ mongoId: id('some_data') })],
        expectedResult: { acknowledged: true, insertedId: id('some_data') },
      },
      {
        method: 'insertMany',
        callback: async (ds: DataSource) =>
          ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]),
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('data 1') }),
          updateLog({ mongoId: id('data 2') }),
        ],
        expectedResult: {
          acknowledged: true,
          insertedCount: 2,
          insertedIds: { 0: id('data 1'), 1: id('data 2') },
        },
      },
      {
        method: 'updateOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .updateOne({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expectedDBState: [{ ...updateLogsBlankState[0], timestamp: 2 }],
        expectedResult: {
          acknowledged: true,
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 0,
          upsertedId: null,
        },
      },
      {
        method: 'updateOne with 0 matches',
        callback: async (ds: DataSource) =>
          ds
            .collection()
            .updateOne({ _id: id('non existent') }, { $set: { data: 'updated data' } }),
        expectedDBState: updateLogsBlankState,
        expectedResult: {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        },
      },
      {
        method: 'replaceOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .replaceOne({ _id: id('collection id 1') }, { data: 'replaced document' });
        },
        expectedDBState: [{ ...updateLogsBlankState[0], timestamp: 2 }],
        expectedResult: {
          acknowledged: true,
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 0,
          upsertedId: null,
        },
      },
      {
        method: 'findOneAndUpdate',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .findOneAndUpdate({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expectedDBState: [{ ...updateLogsBlankState[0], timestamp: 2 }],
        expectedResult: {
          ok: 1,
          value: { _id: id('collection id 1'), data: 'some old data' },
        },
      },
      {
        method: 'findOneAndReplace',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .findOneAndReplace({ _id: id('collection id 1') }, { data: 'updated data' });
        },
        expectedDBState: [{ ...updateLogsBlankState[0], timestamp: 2 }],
        expectedResult: {
          ok: 1,
          value: { _id: id('collection id 1'), data: 'some old data' },
        },
      },
      {
        method: 'updateMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds.collection().updateMany({}, { $set: { data: 'updated data' } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: 2 },
          updateLog({ mongoId: id('data 1'), timestamp: 2 }),
          updateLog({ mongoId: id('data 2'), timestamp: 2 }),
        ],
        expectedResult: {
          acknowledged: true,
          matchedCount: 3,
          modifiedCount: 3,
          upsertedCount: 0,
          upsertedId: null,
        },
      },
      {
        method: 'updateMany with 0 matches',
        callback: async (ds: DataSource) =>
          ds
            .collection()
            .updateMany({ property: 'does not exist' }, { $set: { data: 'updated data' } }),
        expectedDBState: updateLogsBlankState,
        expectedResult: {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        },
      },
      {
        method: 'deleteOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds.collection().deleteOne({ _id: id('collection id 1') });
        },
        expectedDBState: [{ ...updateLogsBlankState[0], deleted: true, timestamp: 2 }],
        expectedResult: { acknowledged: true },
      },
      {
        method: 'deleteMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ _id: id('data 1'), data: 'data 1' });
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .deleteMany({ _id: { $in: [id('collection id 1'), id('data 1')] } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], deleted: true, timestamp: 2 },
          updateLog({ mongoId: id('data 1'), timestamp: 2, deleted: true }),
        ],
        expectedResult: { acknowledged: true },
      },
      {
        method: 'findOneAndDelete',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds.collection().findOneAndDelete({ _id: id('collection id 1') });
        },
        expectedDBState: [{ ...updateLogsBlankState[0], deleted: true, timestamp: 2 }],
        expectedResult: {
          ok: 1,
          value: { _id: id('collection id 1'), data: 'some old data' },
        },
      },
      {
        method: 'bulkWrite (insert)',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .bulkWrite([
              { insertOne: { document: { _id: id('insert one'), data: 'insert one' } } },
              { insertOne: { document: { _id: id('insert many 1'), data: 'insert many 1' } } },
              { insertOne: { document: { _id: id('insert many 2'), data: 'insert many 2' } } },
            ]);
        },
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('insert one'), timestamp: 2 }),
          updateLog({ mongoId: id('insert many 1'), timestamp: 2 }),
          updateLog({ mongoId: id('insert many 2'), timestamp: 2 }),
        ],
        expectedResult: {
          insertedCount: 3,
          insertedIds: { 0: id('insert one'), 1: id('insert many 1'), 2: id('insert many 2') },
        },
      },
      {
        method: 'bulkWrite (delete)',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds
            .collection()
            .bulkWrite([
              { deleteOne: { filter: { _id: id('collection id 1') } } },
              { deleteMany: { filter: { _id: { $in: [id('data 1'), id('data 2')] } } } },
            ]);
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: 2, deleted: true },
          updateLog({ mongoId: id('data 1'), timestamp: 2, deleted: true }),
          updateLog({ mongoId: id('data 2'), timestamp: 2, deleted: true }),
        ],
        expectedResult: { deletedCount: 3 },
      },
      {
        method: 'bulkWrite (update/replace)',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          return ds.collection().bulkWrite([
            {
              updateOne: {
                filter: { _id: id('collection id 1') },
                update: { $set: { data: 'collection id 1 updated' } },
              },
            },
            {
              updateOne: {
                filter: { _id: id('upserted') },
                update: { $set: { data: 'upserted' } },
                upsert: true,
              },
            },
            {
              updateMany: {
                filter: { _id: { $in: [id('data 1'), id('data 2')] } },
                update: { $set: { data: 'data 1 and 2 updated' } },
              },
            },
          ]);
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: 2 },
          updateLog({ mongoId: id('data 1'), timestamp: 2 }),
          updateLog({ mongoId: id('data 2'), timestamp: 2 }),
          updateLog({ mongoId: id('upserted'), timestamp: 2 }),
        ],
        expectedResult: {
          matchedCount: 3,
          modifiedCount: 3,
          upsertedCount: 1,
          upsertedIds: { 1: id('upserted') },
        },
      },
    ];

    it.each(casesForUpdates)(
      '$method should log changes to updatelogs',
      async ({ callback, expectedDBState, expectedResult }) => {
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
            updateLogsBlankState
          );
        }

        const transactionManager2 = new MongoTransactionManager(getClient());
        const dataSource2 = new DataSource(getConnection(), transactionManager2);

        const result = await transactionManager2.run(async () => callback(dataSource2));

        expect(result).toMatchObject(expectedResult);
        expect(await testingDB.mongodb?.collection('updatelogs').find({}).toArray()).toEqual(
          expectedDBState
        );
      }
    );
  });
});
