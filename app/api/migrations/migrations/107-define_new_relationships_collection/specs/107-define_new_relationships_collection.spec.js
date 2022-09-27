import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration define_new_relationships_collection', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(107);
  });

  it('should fail', async () => {
    await migration.up();
  });

  it('should check if a reindex is needed', async () => {
      expect(migration.reindex).toBe(undefined);
    });
});
