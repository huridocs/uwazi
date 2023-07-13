/* eslint-disable max-statements */
import { getIdMapper } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { BulkWriteStream } from '../BulkWriteStream';
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
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ _id: id('some_data'), data: 'some data' });
        },
        expected: [...updateLogsBlankState, updateLog({ mongoId: id('some_data') })],
      },
      {
        method: 'insertMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
        },
        expected: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('data 1') }),
          updateLog({ mongoId: id('data 2') }),
        ],
      },
      {
        method: 'updateOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .updateOne({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expected: [{ ...updateLogsBlankState[0], timestamp: 2 }],
      },
      {
        method: 'updateOne with 0 matches',
        callback: async (ds: DataSource) => {
          await ds
            .collection()
            .updateOne({ _id: id('non existent') }, { $set: { data: 'updated data' } });
        },
        expected: updateLogsBlankState,
      },
      {
        method: 'replaceOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .replaceOne({ _id: id('collection id 1') }, { data: 'replaced document' });
        },
        expected: [{ ...updateLogsBlankState[0], timestamp: 2 }],
      },
      {
        method: 'findOneAndUpdate',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .findOneAndUpdate({ _id: id('collection id 1') }, { $set: { data: 'updated data' } });
        },
        expected: [{ ...updateLogsBlankState[0], timestamp: 2 }],
      },
      {
        method: 'findOneAndReplace',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .findOneAndReplace({ _id: id('collection id 1') }, { data: 'updated data' });
        },
        expected: [{ ...updateLogsBlankState[0], timestamp: 2 }],
      },
      {
        method: 'updateMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().updateMany({}, { $set: { data: 'updated data' } });
        },
        expected: [
          { ...updateLogsBlankState[0], timestamp: 2 },
          updateLog({ mongoId: id('data 1'), timestamp: 2 }),
          updateLog({ mongoId: id('data 2'), timestamp: 2 }),
        ],
      },
      {
        method: 'updateMany with 0 matches',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds
            .collection()
            .updateMany({ property: 'does not exist' }, { $set: { data: 'updated data' } });
        },
        expected: updateLogsBlankState,
      },
      {
        method: 'deleteOne',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().deleteOne({ _id: id('collection id 1') });
        },
        expected: [{ ...updateLogsBlankState[0], deleted: true, timestamp: 2 }],
      },
      {
        method: 'deleteMany',
        callback: async (ds: DataSource) => {
          await ds.collection().insertOne({ _id: id('data 1'), data: 'data 1' });
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().deleteMany({ _id: { $in: [id('collection id 1'), id('data 1')] } });
        },
        expected: [
          { ...updateLogsBlankState[0], deleted: true, timestamp: 2 },
          updateLog({ mongoId: id('data 1'), timestamp: 2, deleted: true }),
        ],
      },
      {
        method: 'findOneAndDelete',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          await ds.collection().findOneAndDelete({ _id: id('collection id 1') });
        },
        expected: [{ ...updateLogsBlankState[0], deleted: true, timestamp: 2 }],
      },
      {
        method: 'bulkWrite (insert)',
        callback: async (ds: DataSource) => {
          jest.spyOn(Date, 'now').mockReturnValue(2);
          const stream = new BulkWriteStream(ds.collection());
          await stream.insert({ _id: id('insert one'), data: 'insert one' });
          await stream.insertMany([
            { _id: id('insert many 1'), data: 'insert many 1' },
            { _id: id('insert many 2'), data: 'insert many 1' },
          ]);
          await stream.flush();
        },
        expected: [
          ...updateLogsBlankState,
          updateLog({ mongoId: id('insert one'), timestamp: 2 }),
          updateLog({ mongoId: id('insert many 1'), timestamp: 2 }),
          updateLog({ mongoId: id('insert many 2'), timestamp: 2 }),
        ],
      },
      {
        method: 'bulkWrite (delete)',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          const stream = new BulkWriteStream(ds.collection());
          await stream.delete({ _id: id('collection id 1') });
          await stream.deleteMany({ _id: { $in: [id('data 1'), id('data 2')] } });
          await stream.flush();
        },
        expected: [
          { ...updateLogsBlankState[0], timestamp: 2, deleted: true },
          updateLog({ mongoId: id('data 1'), timestamp: 2, deleted: true }),
          updateLog({ mongoId: id('data 2'), timestamp: 2, deleted: true }),
        ],
      },
      {
        method: 'bulkWrite (update/replace)',
        callback: async (ds: DataSource) => {
          await ds.collection().insertMany([
            { _id: id('data 1'), data: 'data 1' },
            { _id: id('data 2'), data: 'data 2' },
          ]);
          jest.spyOn(Date, 'now').mockReturnValue(2);
          const stream = new BulkWriteStream(ds.collection());
          await stream.updateOne(
            { _id: id('collection id 1') },
            { $set: { data: 'collection id 1 updated' } }
          );
          await stream.updateOne({ _id: id('upserted') }, { $set: { data: 'upserted' } }, true);
          await stream.updateMany(
            { _id: { $in: [id('data 1'), id('data 2')] } },
            { $set: { data: 'data 1 and 2 updated' } }
          );
          await stream.flush();
        },
        expected: [
          { ...updateLogsBlankState[0], timestamp: 2 },
          updateLog({ mongoId: id('data 1'), timestamp: 2 }),
          updateLog({ mongoId: id('data 2'), timestamp: 2 }),
          updateLog({ mongoId: id('upserted'), timestamp: 2 }),
        ],
      },
    ];

    it.each(casesForUpdates)(
      '$method should log changes to updatelogs',
      async ({ callback, expected }) => {
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

        await transactionManager2.run(async () => {
          await callback(dataSource2);
        });

        expect(await testingDB.mongodb?.collection('updatelogs').find({}).toArray()).toEqual(
          expected
        );
      }
    );
  });
});
