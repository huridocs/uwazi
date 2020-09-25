import { testingDB } from 'api/utils/testing_db';
import { IGNORED_ENDPOINTS } from 'api/activitylog/activitylogMiddleware';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove irrelevant activity log entries', () => {
  beforeAll(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(29);
  });

  describe('up', () => {
    beforeAll(async () => {
      await migration.up(testingDB.mongodb);
    });

    it('should remove activity entries with unwanted methods', async () => {
      const deletedMethods = await testingDB.mongodb
        .collection('activitylogs')
        .find({ method: { $in: ['GET', 'OPTIONS', 'HEAD'] } })
        .count();

      const remainingEntries = await testingDB.mongodb
        .collection('activitylogs')
        .find({ method: { $not: { $in: ['GET', 'OPTIONS', 'HEAD'] } } })
        .count();

      expect(deletedMethods).toBe(0);
      expect(remainingEntries).toBe(2);
    });

    it('should remove activity entries with unwanted urls', async () => {
      const ignoredEntries = await testingDB.mongodb
        .collection('activitylogs')
        .find({ url: { $in: IGNORED_ENDPOINTS } })
        .count();

      expect(ignoredEntries).toBe(0);
    });
  });
});
