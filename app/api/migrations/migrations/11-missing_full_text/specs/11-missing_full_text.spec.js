import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration missing_full_text', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(11);
  });

  it('should copy fulltext for entities with files from the default language', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb
      .collection('entities')
      .find({ language: 'pt' })
      .toArray();
    expect(entities[0].fullText).toBe('some full text');
  });
});
