import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration fix_udaptelogs', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(24);
  });

  it('should remove all updatelogs without mongoId', async () => {
    await migration.up(testingDB.mongodb);
    const updatelogs = await testingDB.mongodb.collection('updatelogs').find().toArray();

    expect(updatelogs).toEqual([
      expect.objectContaining({
        mongoId: expect.anything(),
        namespace: 'entities',
      }),
      expect.objectContaining({
        mongoId: expect.anything(),
        namespace: 'entities',
      }),
    ]);
  });
});
