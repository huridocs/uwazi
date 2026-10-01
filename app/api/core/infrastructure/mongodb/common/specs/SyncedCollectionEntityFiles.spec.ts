/* eslint-disable max-statements */
import { Document } from 'mongodb';
import { StandardLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { MongoDataSource } from '../MongoDataSource.js';
import { MongoTransactionManager } from '../MongoTransactionManager.js';
import { getClient, getConnection, getTenant } from '../getConnectionForCurrentTenant.js';

const factory = getFixturesFactory();

const originalTimestamp = 100;
const updatedTimestamp = 500;

const fixtures = {
  entities: [factory.entity('entity1', 'template1'), factory.entity('entity2', 'template1')],
  files: [
    factory.fileDeprecated('document1', 'entity1', 'document', 'document1_filename'),
    factory.fileDeprecated('attachment1', 'entity1', 'attachment', 'attachment1_filename'),
    factory.fileDeprecated('thumbnail1', 'entity1', 'thumbnail', 'thumbnail1_filename'),
    factory.fileDeprecated('unlogged1', 'entity1', 'attachment', 'unlogged1_filename'),
    factory.fileDeprecated('held1', 'entity1', 'attachment', 'held1_filename'),
    factory.fileDeprecated('custom1', undefined, 'custom', 'custom1_filename'),
    factory.fileDeprecated('document2', 'entity2', 'document', 'document2_filename'),
  ],
  templates: [
    {
      _id: factory.id('template1'),
      sharedId: 'entity1',
      name: 'template1',
    },
  ],
  updatelogs: [
    factory.updatelog('entities', 'entity1-en', false, originalTimestamp),
    factory.updatelog('entities', 'entity2-en', false, originalTimestamp),
    factory.updatelog('files', 'document1', false, originalTimestamp),
    factory.updatelog('files', 'attachment1', false, originalTimestamp),
    factory.updatelog('files', 'thumbnail1', false, originalTimestamp),
    factory.updatelog('files', 'held1', true, originalTimestamp),
    factory.updatelog('files', 'custom1', false, originalTimestamp),
    factory.updatelog('files', 'document2', false, originalTimestamp),
    factory.updatelog('templates', 'template1', false, originalTimestamp),
  ],
};

class LoggingSource extends MongoDataSource<Document> {
  protected collectionName: string;

  constructor(transactionManager: MongoTransactionManager, collectionName: string) {
    super(getConnection(), transactionManager);
    this.collectionName = collectionName;
  }

  collection() {
    return this.getCollection();
  }
}

const createTransactionManager = () =>
  new MongoTransactionManager(getClient(), new StandardLogger(() => {}, getTenant()));

const fileLog = async (mongoId: string) => {
  const logs = await testingDB.mongodb!.collection('updatelogs').find({}).toArray();
  return logs.find(log => log.mongoId.toString() === factory.id(mongoId).toString());
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('SyncedCollection entity writes and file update logs', () => {
  it('refreshes file logs for that sharedId when an entity is updated', async () => {
    const transactionManager = createTransactionManager();
    const entities = new LoggingSource(transactionManager, 'entities');

    await transactionManager.run(async () => {
      await entities.collection().bulkWrite([
        {
          updateOne: {
            filter: { _id: factory.id('entity1-en') },
            update: { $set: { title: 'updated' } },
          },
        },
      ]);
    });

    await expect(fileLog('document1')).resolves.toMatchObject({
      namespace: 'files',
      deleted: false,
      timestamp: updatedTimestamp,
    });
    await expect(fileLog('attachment1')).resolves.toMatchObject({
      namespace: 'files',
      deleted: false,
      timestamp: updatedTimestamp,
    });
    await expect(fileLog('thumbnail1')).resolves.toMatchObject({
      namespace: 'files',
      deleted: false,
      timestamp: updatedTimestamp,
    });
    await expect(fileLog('unlogged1')).resolves.toMatchObject({
      namespace: 'files',
      deleted: false,
      timestamp: updatedTimestamp,
    });
    await expect(fileLog('held1')).resolves.toMatchObject({
      namespace: 'files',
      deleted: false,
      timestamp: updatedTimestamp,
    });
    await expect(fileLog('document2')).resolves.toMatchObject({ timestamp: originalTimestamp });
    await expect(fileLog('custom1')).resolves.toMatchObject({ timestamp: originalTimestamp });
  });

  it('refreshes file logs when an entity language row is inserted', async () => {
    const transactionManager = createTransactionManager();
    const entities = new LoggingSource(transactionManager, 'entities');

    await transactionManager.run(async () => {
      await entities.collection().insertMany([
        {
          _id: factory.id('entity1-es'),
          sharedId: 'entity1',
          language: 'es',
          title: 'entity1',
        },
      ]);
    });

    await expect(fileLog('document1')).resolves.toMatchObject({
      namespace: 'files',
      deleted: false,
      timestamp: updatedTimestamp,
    });
    await expect(fileLog('document2')).resolves.toMatchObject({ timestamp: originalTimestamp });
  });

  it('does not refresh file logs when an entity is deleted', async () => {
    const transactionManager = createTransactionManager();
    const entities = new LoggingSource(transactionManager, 'entities');

    await transactionManager.run(async () => {
      await entities.collection().deleteMany({ sharedId: 'entity1' });
    });

    await expect(fileLog('document1')).resolves.toMatchObject({
      deleted: false,
      timestamp: originalTimestamp,
    });
    await expect(fileLog('held1')).resolves.toMatchObject({
      deleted: true,
      timestamp: originalTimestamp,
    });
    await expect(fileLog('unlogged1')).resolves.toBeUndefined();
  });

  it('does not refresh file logs when another collection is updated', async () => {
    const transactionManager = createTransactionManager();
    const templates = new LoggingSource(transactionManager, 'templates');

    await transactionManager.run(async () => {
      await templates
        .collection()
        .updateOne({ _id: factory.id('template1') }, { $set: { name: 'renamed' } });
    });

    await expect(fileLog('document1')).resolves.toMatchObject({ timestamp: originalTimestamp });
  });
});
