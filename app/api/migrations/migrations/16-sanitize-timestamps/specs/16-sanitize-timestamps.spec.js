/** @format */

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration sanitize-timestamops', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(16);
  });

  it('should change all string timestamps to int', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(Number.isInteger(entities[0].metadata.date)).toBe(true);
    expect(Number.isInteger(entities[0].metadata.multi_date[0])).toBe(true);
    expect(Number.isInteger(entities[0].metadata.multi_date[1])).toBe(true);
    expect(Number.isInteger(entities[0].metadata.date_range.from)).toBe(true);
    expect(Number.isInteger(entities[0].metadata.date_range.to)).toBe(true);
    expect(Number.isInteger(entities[0].metadata.multi_date_range[0].from)).toBe(true);
    expect(Number.isInteger(entities[0].metadata.multi_date_range[0].to)).toBe(true);
    expect(entities[0].metadata.text).toBe('23442');
    expect(entities[0].metadata.country).toEqual(['sdf3fsf4']);
  });
});
