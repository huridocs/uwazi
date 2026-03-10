import { testingDB } from 'api/utils/testing_db';
import { BODY_REQUIRED_ENDPOINTS, IGNORED_ENDPOINTS } from 'api/activitylog/activitylogMiddleware';
import date from 'api/utils/date';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration activity log sanitization', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
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
        .countDocuments({ method: { $in: ['GET', 'OPTIONS', 'HEAD'] } });

      expect(deletedMethods).toBe(0);
    });

    it('should keep all wanted entries', async () => {
      const remainingEntries = await testingDB.mongodb
        .collection('activitylogs')
        .countDocuments({ method: { $not: { $in: ['GET', 'OPTIONS', 'HEAD'] } } });
      expect(remainingEntries).toBe(7);
    });

    it('should remove activity entries with unwanted urls', async () => {
      const unWantedEntries = await testingDB.mongodb
        .collection('activitylogs')
        .countDocuments({ url: { $in: IGNORED_ENDPOINTS } });

      expect(unWantedEntries).toBe(0);
    });

    it('should remove upload activity entries without body', async () => {
      const unWantedEntries = await testingDB.mongodb
        .collection('activitylogs')
        .countDocuments({ url: { $in: BODY_REQUIRED_ENDPOINTS }, body: {} });

      expect(unWantedEntries).toBe(0);
    });

    it('should keep upload activity entries with body', async () => {
      const remainingEntries = await testingDB.mongodb
        .collection('activitylogs')
        .countDocuments({ url: { $in: BODY_REQUIRED_ENDPOINTS }, body: "{ entityId: 'entity1' }" });

      expect(remainingEntries).toBe(2);
    });

    it('should set expireAt with a year upfront into remaining entries', async () => {
      const expireAt = date.addYearsToCurrentDate(1);
      const unWantedEntries = await testingDB.mongodb
        .collection('activitylogs')
        .countDocuments({ expireAt });

      expect(unWantedEntries).toBe(7);
    });

    it('should remove updatelog entries for activitylog', async () => {
      const unWantedEntries = await testingDB.mongodb
        .collection('updatelogs')
        .countDocuments({ namespace: 'activitylog' });

      const remainingEntries = await testingDB.mongodb.collection('updatelogs').countDocuments();

      expect(unWantedEntries).toBe(0);
      expect(remainingEntries).toBe(2);
    });
  });
});
