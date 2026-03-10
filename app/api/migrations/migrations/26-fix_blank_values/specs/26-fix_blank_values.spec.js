import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration fix_blank_values', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(26);
  });

  it('should set [] to all values on metadata that are blank string', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[0].metadata.select).toEqual([]);
    expect(entities[0].metadata.another_value).toEqual([{ value: 'value' }]);

    expect(entities[1].metadata.select2).toEqual([]);
    expect(entities[1].metadata.correct_value).toEqual([{ value: 'correct_value' }]);
  });
});
