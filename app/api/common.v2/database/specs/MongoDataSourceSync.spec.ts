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
  {
    _id: id('collection id 2'),
    data: 'some old data 2',
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
  {
    _id: new ObjectId(),
    timestamp: 1234,
    namespace: 'collection',
    mongoId: id('collection id 2'),
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

const updatedTimestamp = 2;

describe('collection with automatic log to updatelogs', () => {
  describe('should log creations/updates/deletions on updatelogs collection', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1);
    });

    const casesForUpdates = [
      {
        description: 'insertOne',
        callback: async (ds: DataSource) =>
          ds.collection().insertOne({ _id: id('some_data'), data: 'some data' }),
        expectedDBState: [...updateLogsBlankState, updateLog({ mongoId: id('some_data') })],
        expectedResult: { acknowledged: true, insertedId: id('some_data') },
      },
      {
        description: 'insertMany',
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
        description: 'updateOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .updateOne({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp },
          updateLogsBlankState[1],
        ],
        expectedResult: { acknowledged: true, matchedCount: 1, modifiedCount: 1 },
      },
      {
        description: 'updateOne without previous updatelog',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          await getConnection().collection('updatelogs').deleteMany();
          return ds
            .collection()
            .updateOne({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
        ],
        expectedDBStateOnTransactionError: [],
        expectedResult: { acknowledged: true, matchedCount: 1, modifiedCount: 1 },
      },
      {
        description: 'updateOne with upsert',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .updateOne(
              { _id: id('non existent') },
              { $set: { data: 'updated data' } },
              { upsert: true }
            );
        },
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('non existent'), timestamp: updatedTimestamp }),
        ],
        expectedResult: { acknowledged: true, upsertedCount: 1, upsertedId: id('non existent') },
      },
      {
        description: 'updateOne with 0 matches',
        callback: async (ds: DataSource) =>
          ds
            .collection()
            .updateOne({ _id: id('non existent') }, { $set: { data: 'updated data' } }),
        expectedDBState: updateLogsBlankState,
        expectedResult: { acknowledged: true, matchedCount: 0 },
      },
      {
        description: 'replaceOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .replaceOne({ _id: id('collection id 1') }, { data: 'replaced document' });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp },
          updateLogsBlankState[1],
        ],
        expectedResult: { acknowledged: true, matchedCount: 1, modifiedCount: 1 },
      },
      {
        description: 'replaceOne with upsert',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .replaceOne(
              { _id: id('non existent id') },
              { data: 'replaced document' },
              { upsert: true }
            );
        },
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('non existent id'), timestamp: updatedTimestamp }),
        ],
        expectedResult: { acknowledged: true, upsertedCount: 1, upsertedId: id('non existent id') },
      },
      {
        description: 'replaceOne without previous updatelog',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          await getConnection().collection('updatelogs').deleteMany();
          return ds
            .collection()
            .replaceOne({ _id: id('collection id 1') }, { data: 'updated data' });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
        ],
        expectedResult: { acknowledged: true, upsertedCount: 0 },
      },
      {
        description: 'findOneAndUpdate',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .findOneAndUpdate({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp },
          updateLogsBlankState[1],
        ],
        expectedResult: { ok: 1, value: { _id: id('collection id 1'), data: 'some old data' } },
      },
      {
        description: 'findOneAndUpdate with upsert',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .findOneAndUpdate(
              { _id: id('non existent id') },
              { $set: { data: 'upserted data' } },
              { upsert: true }
            );
        },
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('non existent id'), timestamp: updatedTimestamp }),
        ],
        expectedResult: {
          lastErrorObject: { n: 1, updatedExisting: false, upserted: id('non existent id') },
          ok: 1,
        },
      },
      {
        description: 'findOneAndUpdate without previous updatelog ',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          await getConnection().collection('updatelogs').deleteMany();
          return ds
            .collection()
            .findOneAndUpdate({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
        ],
        expectedResult: { ok: 1, value: { _id: id('collection id 1'), data: 'some old data' } },
      },
      {
        description: 'findOneAndReplace',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .findOneAndReplace({ _id: id('collection id 1') }, { data: 'updated data' });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp },
          updateLogsBlankState[1],
        ],
        expectedResult: { ok: 1, value: { _id: id('collection id 1'), data: 'some old data' } },
      },
      {
        description: 'findOneAndReplace with upsert',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .findOneAndReplace(
              { _id: id('non existent id') },
              { data: 'upserted data' },
              { upsert: true }
            );
        },
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('non existent id'), timestamp: updatedTimestamp }),
        ],
        expectedResult: {
          lastErrorObject: { n: 1, updatedExisting: false, upserted: id('non existent id') },
          ok: 1,
        },
      },
      {
        description: 'findOneAndReplace without previous updatelogs',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          await getConnection().collection('updatelogs').deleteMany();
          return ds
            .collection()
            .findOneAndReplace({ _id: id('collection id 1') }, { data: 'updated data' });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
        ],
        expectedResult: { ok: 1, value: { _id: id('collection id 1'), data: 'some old data' } },
      },
      {
        description: 'updateMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds.collection().updateMany({}, { $set: { data: 'updated data' } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp },
          { ...updateLogsBlankState[1], timestamp: updatedTimestamp },
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('data 2'), timestamp: updatedTimestamp }),
        ],
        expectedResult: { acknowledged: true, matchedCount: 4, modifiedCount: 4 },
      },
      {
        description: 'updateMany with upsert',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .updateMany(
              { _id: id('non existent id') },
              { $set: { _id: id('non existent id'), data: 'updated data' } },
              { upsert: true }
            );
        },
        expectedDBState: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('non existent id'), timestamp: updatedTimestamp }),
        ],
        expectedResult: { acknowledged: true, upsertedCount: 1, upsertedId: id('non existent id') },
      },
      {
        description: 'updateMany without previous updatelogs',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          await getConnection().collection('updatelogs').deleteMany();
          return ds.collection().updateMany({}, { $set: { data: 'updated data' } });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
          { ...updateLogsBlankState[1], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
        ],
        expectedResult: { acknowledged: true, matchedCount: 2, modifiedCount: 2 },
      },
      {
        description: 'updateMany with 0 matches',
        callback: async (ds: DataSource) =>
          ds
            .collection()
            .updateMany({ property: 'does not exist' }, { $set: { data: 'updated data' } }),
        expectedDBState: updateLogsBlankState,
        expectedResult: { acknowledged: true, matchedCount: 0 },
      },
      {
        description: 'deleteOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds.collection().deleteOne({ _id: id('collection id 1') });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], deleted: true, timestamp: updatedTimestamp },
          updateLogsBlankState[1],
        ],
        expectedResult: { acknowledged: true },
      },
      {
        description: 'deleteOne without previous updatelogs',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          await getConnection().collection('updatelogs').deleteMany();
          return ds.collection().deleteOne({ _id: id('collection id 1') });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          {
            ...updateLogsBlankState[0],
            deleted: true,
            timestamp: updatedTimestamp,
            _id: expect.any(ObjectId),
          },
        ],
        expectedResult: { acknowledged: true },
      },
      {
        description: 'deleteMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ _id: id('data 1'), data: 'data 1' });
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .deleteMany({ _id: { $in: [id('collection id 1'), id('data 1')] } });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], deleted: true, timestamp: updatedTimestamp },
          updateLogsBlankState[1],
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp, deleted: true }),
        ],
        expectedResult: { acknowledged: true },
      },
      {
        description: 'deleteMany without previous updatelogs',
        callback: async (ds: DataSource) => {
          await getConnection().collection('updatelogs').deleteMany();
          await ds.collection().insertOne({ _id: id('data 1'), data: 'data 1' });
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .deleteMany({ _id: { $in: [id('collection id 1'), id('data 1')] } });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp, deleted: true }),
          {
            ...updateLogsBlankState[0],
            deleted: true,
            timestamp: updatedTimestamp,
            _id: expect.any(ObjectId),
          },
        ],
        expectedResult: { acknowledged: true },
      },
      {
        description: 'findOneAndDelete',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds.collection().findOneAndDelete({ _id: id('collection id 1') });
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], deleted: true, timestamp: updatedTimestamp },
          updateLogsBlankState[1],
        ],
        expectedResult: {
          ok: 1,
          value: { _id: id('collection id 1'), data: 'some old data' },
        },
      },
      {
        description: 'findOneAndDelete without previous updatelogs',
        callback: async (ds: DataSource) => {
          await getConnection().collection('updatelogs').deleteMany();
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds.collection().findOneAndDelete({ _id: id('collection id 1') });
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          {
            ...updateLogsBlankState[0],
            deleted: true,
            timestamp: updatedTimestamp,
            _id: expect.any(ObjectId),
          },
        ],
        expectedResult: {
          ok: 1,
          value: { _id: id('collection id 1'), data: 'some old data' },
        },
      },
      {
        description: 'bulkWrite (insert)',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
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
          updateLog({ mongoId: id('insert one'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('insert many 1'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('insert many 2'), timestamp: updatedTimestamp }),
        ],
        expectedResult: {
          insertedCount: 3,
          insertedIds: { 0: id('insert one'), 1: id('insert many 1'), 2: id('insert many 2') },
        },
      },
      {
        description: 'bulkWrite (delete)',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .bulkWrite([
              { deleteOne: { filter: { _id: id('collection id 1') } } },
              { deleteMany: { filter: { _id: { $in: [id('data 1'), id('data 2')] } } } },
            ]);
        },
        expectedDBState: [
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, deleted: true },
          updateLogsBlankState[1],
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp, deleted: true }),
          updateLog({ mongoId: id('data 2'), timestamp: updatedTimestamp, deleted: true }),
        ],
        expectedResult: { deletedCount: 3 },
      },
      {
        description: 'bulkWrite (delete) without previous updatelogs',
        callback: async (ds: DataSource) => {
          await getConnection().collection('updatelogs').deleteMany();
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
          return ds
            .collection()
            .bulkWrite([
              { deleteOne: { filter: { _id: id('collection id 1') } } },
              { deleteMany: { filter: { _id: { $in: [id('data 1'), id('data 2')] } } } },
            ]);
        },
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp, deleted: true }),
          updateLog({ mongoId: id('data 2'), timestamp: updatedTimestamp, deleted: true }),
          {
            ...updateLogsBlankState[0],
            timestamp: updatedTimestamp,
            deleted: true,
            _id: expect.any(ObjectId),
          },
        ],
        expectedResult: { deletedCount: 3 },
      },
      {
        description: 'bulkWrite (update/replace)',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
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
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp },
          updateLogsBlankState[1],
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('data 2'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('upserted'), timestamp: updatedTimestamp }),
        ],
        expectedResult: {
          matchedCount: 3,
          modifiedCount: 3,
          upsertedCount: 1,
          upsertedIds: { 1: id('upserted') },
        },
      },
      {
        description: 'bulkWrite (update/replace) without previous updatelogs',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          await getConnection().collection('updatelogs').deleteMany();
          jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
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
        expectedDBStateOnTransactionError: [],
        expectedDBState: [
          updateLog({ mongoId: id('data 1'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('data 2'), timestamp: updatedTimestamp }),
          updateLog({ mongoId: id('upserted'), timestamp: updatedTimestamp }),
          { ...updateLogsBlankState[0], timestamp: updatedTimestamp, _id: expect.any(ObjectId) },
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
      '$description should log changes to updatelogs if any',
      async ({
        callback,
        expectedDBState,
        expectedResult,
        expectedDBStateOnTransactionError = updateLogsBlankState,
      }) => {
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
            expectedDBStateOnTransactionError
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
