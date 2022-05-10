import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove_duplicate_thesauri_entries', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(75);
  });

  it('should not fail', async () => {
    await migration.up();
    fail('TODO');
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(undefined);
    fail('TODO');
  });
});
