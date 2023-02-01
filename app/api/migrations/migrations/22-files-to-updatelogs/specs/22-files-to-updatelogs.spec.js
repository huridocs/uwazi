import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { file1, file2, file3 } from './fixtures.js';

const query = (collectionName, queryObject = {}, select = {}) =>
  testingDB.mongodb.collection(collectionName).find(queryObject, select).toArray();

describe('migration files-to-updatelogs', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(22);
  });

  it('should create entries on updatelogs for all files', async () => {
    await migration.up(testingDB.mongodb);
    const fileLogs = await query('updatelogs');

    expect(fileLogs.length).toBe(3);
    expect(fileLogs).toEqual([
      expect.objectContaining({
        timestamp: 50,
        namespace: 'files',
        mongoId: file3,
        deleted: false,
      }),
      expect.objectContaining({
        timestamp: 0,
        namespace: 'files',
        mongoId: file1,
        deleted: false,
      }),
      expect.objectContaining({
        timestamp: 0,
        namespace: 'files',
        mongoId: file2,
        deleted: false,
      }),
    ]);
  });

  describe('when it has lastSync', () => {
    it('should use lastSync as timestamp', async () => {
      await testingDB.mongodb.collection('syncs').insertOne({
        lastSync: 20,
      });

      await migration.up(testingDB.mongodb);
      const [file3log, file1log, file2log] = await query('updatelogs');

      expect(file3log).toEqual(
        expect.objectContaining({
          timestamp: 50,
        })
      );
      expect(file1log).toEqual(
        expect.objectContaining({
          timestamp: 20,
        })
      );
      expect(file2log).toEqual(
        expect.objectContaining({
          timestamp: 20,
        })
      );
    });
  });
});
