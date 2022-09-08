import testingDB from 'api/utils/testing_db';
import migration from '../index.js';

describe('migration reindex_if_topic_classification_active', () => {
  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(106);
  });

  describe('when entities do not have suggestedMetadata', () => {
    it('should set reindex flag to false', async () => {
      await testingDB.setupFixturesAndContext({
        entities: [{ title: 'test_doc' }, { title: 'test_doc2' }],
      });
      await migration.up(testingDB.mongodb);

      expect(migration.reindex).toBe(false);
    });
  });

  describe('when entities have suggestedMetadata', () => {
    it('should set reindex flag to true', async () => {
      await testingDB.setupFixturesAndContext({
        entities: [
          { title: 'test_doc' },
          { title: 'with suggestedMetadata', suggestedMetadata: [] },
        ],
      });
      await migration.up(testingDB.mongodb);

      expect(migration.reindex).toBe(true);
    });
  });
});
