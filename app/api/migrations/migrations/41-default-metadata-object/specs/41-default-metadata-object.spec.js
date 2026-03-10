import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration default-metadata-object', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(41);
  });

  it('should add an empty object to all entities without metadata', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb
      .collection('entities')
      .find({})
      .sort({ title: 1 })
      .toArray();

    expect(entities[0].metadata).toEqual({});
    expect(entities[1].metadata).toEqual({});
    expect(entities[2].metadata).toEqual({});
    expect(entities[3].metadata).toEqual({ some_prop: [{ value: 42 }] });
  });
});
