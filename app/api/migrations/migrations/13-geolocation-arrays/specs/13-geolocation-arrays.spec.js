import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration geolocation-arrays', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(13);
  });

  it('should replace every geolocation metadata value with an array ommiting already migrated data', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb
      .collection('entities')
      .find({}, { projection: { template: false, _id: false }, sort: { title: 1 } })
      .toArray();

    expect(entities).toMatchSnapshot();
  });
});
