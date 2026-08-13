import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { MongoTranslationsSyncHandler } from '../MongoTranslationsSyncHandler.js';
import { TranslationsSyncHandlerFactory } from '../TranslationsSyncHandlerFactory.js';

const fixtures: DBFixture = {
  translationsV2: [],
};

describe('MongoTranslationsSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  it('should delete by natural key then upsert on save', async () => {
    const handler = new MongoTranslationsSyncHandler();
    const oldId = new ObjectId();
    const newId = new ObjectId();

    await testingEnvironment.db.getCollection('translationsV2')!.insertOne({
      _id: oldId,
      language: 'en',
      key: 'Search',
      value: 'Old',
      context: { type: 'Uwazi UI', label: 'User Interface', id: 'System' },
    });

    await testingEnvironment.runWithContext(async () => {
      await handler.save({
        _id: newId.toHexString(),
        language: 'en',
        key: 'Search',
        value: 'New',
        context: { type: 'Uwazi UI', label: 'User Interface', id: 'System' },
      });
    });

    const rows = await testingEnvironment.db.getAllFrom('translationsV2');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: newId,
      language: 'en',
      key: 'Search',
      value: 'New',
      context: { id: 'System' },
    });
  });

  it('TranslationsSyncHandlerFactory should return the Mongo handler', () => {
    expect(TranslationsSyncHandlerFactory.default()).toBeInstanceOf(MongoTranslationsSyncHandler);
  });
});
