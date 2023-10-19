import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove_translationsv2_traces', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(146);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should delete translations collection', async () => {
    await migration.up(testingDB.mongodb);
    const collectionNames = (await testingDB.mongodb.listCollections().toArray()).map(c => c.name);
    expect(collectionNames.includes('translations')).toBe(false);
  });

  it('should delete all translations entries in updatelogs', async () => {
    await migration.up(testingDB.mongodb);
    const updatelogs = await testingDB.mongodb.collection('updatelogs').find().toArray();
    expect(updatelogs).toMatchObject([{ namespace: 'migrations' }, { namespace: 'entities' }]);
  });

  it('should not fail if translations collection did not exist', async () => {
    await migration.up(testingDB.mongodb);
    await migration.up(testingDB.mongodb);
    const updatelogs = await testingDB.mongodb.collection('updatelogs').find().toArray();
    expect(updatelogs).toMatchObject([{ namespace: 'migrations' }, { namespace: 'entities' }]);
  });
});
