import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixturesWithFormat from './fixtures_with_format.js';
import fixturesWithoutFormat from './fixtures_without_format.js';

describe('migration settings-date-format', () => {
  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(27);
  });

  it('should replace the dateFormat string if it exists', async () => {
    await testingDB.clearAllAndLoad(fixturesWithFormat);
    await migration.up(testingDB.mongodb);
    const [{ dateFormat }] = await testingDB.mongodb.collection('settings').find({}).toArray();

    expect(dateFormat).toBe('yyyy-MM-dd');
  });

  it('should not replace the dateFormat string if it does not exists', async () => {
    await testingDB.clearAllAndLoad(fixturesWithoutFormat);
    await migration.up(testingDB.mongodb);
    const [{ dateFormat }] = await testingDB.mongodb.collection('settings').find({}).toArray();

    expect(dateFormat).toBe(undefined);
  });

  it('should not affect other settings', async () => {
    await testingDB.clearAllAndLoad(fixturesWithFormat);
    await migration.up(testingDB.mongodb);
    const settingsCollection = await testingDB.mongodb.collection('settings').find({}).toArray();
    expect(settingsCollection.length).toBe(1);

    const [{ otherProperty }] = settingsCollection;
    expect(otherProperty).toBe('test');
  });
});
