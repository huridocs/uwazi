import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove_duplicate_thesauri_entries', () => {
  let savedThesaurus;

  beforeEach(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
    await migration.up();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(77);
  });

  it('should remove duplicated thesauri entries from root and groups', async () => {
    fail('TODO');
  });

  it('should unify groups and keep the unified group, if there is any', async () => {
    fail('TODO');
  });

  it.each([
    { case: 'select' },
    { case: 'multiselect' },
    { case: 'inherited select' },
    { case: 'inherited multiselect' },
  ])('should unify $case entity properties and point to remaining value', () => {
    fail('TODO');
  });

  it('should reindex if there were changed entities', async () => {
    expect(migration.reindex).toBe(true);
  });

  it('should reindex if there were no changes to entities', async () => {
    fail('TODO');
    expect(migration.reindex).toBe(false);
  });
});
