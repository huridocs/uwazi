import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

let db;

describe('migration missing_languages', () => {
  beforeAll(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
    db = testingDB.mongodb;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(59);
  });

  it('should reindex when adding new entites', async () => {
    expect(migration.reindex).toBe(true);
  });

  // it('should not reindex when no changes are needed', async () => {
  //   await migration.up(db);
  //   expect(migration.reindex).toBe(false);
  // });

  // it('should ignore entities with no language', async () => {
  //   // fail();
  // });

  it('should create new entities to fill missing languages', async () => {
    // fail();
  });

  // it('should copy root data', async () => {
  //   fail();
  // });

  // it('should copy properties that are not translated, or are not translatable without user input', async () => {
  //   fail();
  // });

  // it('should translate thesauri related (select, multiselect) properties', async () => {
  //   fail();
  // });

  // it('should copy non-inherited relationship fields', async () => {
  //   fail();
  // });

  // it('should make inherited values inherit from the entity in the proper language', async () => {
  //   fail();
  // });
});
