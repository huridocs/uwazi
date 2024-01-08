import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration repair_select_parent_denormalization', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(153);
  });

  it('should fail', async () => {
    await migration.up();
  });

  it('should check if a reindex is needed', async () => {
      expect(migration.reindex).toBe(undefined);
    });
});
