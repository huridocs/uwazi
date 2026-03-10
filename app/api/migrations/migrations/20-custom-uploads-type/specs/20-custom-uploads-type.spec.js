import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration custom-uploads-type', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(20);
  });

  it('should add type="custom" to all files', async () => {
    await migration.up(testingDB.mongodb);

    const files = await testingDB.mongodb.collection('files').find().toArray();

    expect(files).toEqual([
      expect.objectContaining({ filename: 'test.txt', type: 'custom' }),
      expect.objectContaining({ filename: 'test2.txt', type: 'custom' }),
    ]);
  });
});
