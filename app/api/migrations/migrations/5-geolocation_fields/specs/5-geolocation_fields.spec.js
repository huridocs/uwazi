import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration geolocation_fields', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(5);
  });

  it('should set the geolocation values to all documents', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[0].metadata.geolocation_geolocation).toEqual({ lat: 5, lon: 8 });
    expect(entities[1].metadata.geolocation_geolocation).toEqual({ lat: 5, lon: 8 });
    expect(entities[2].metadata.geolocation_geolocation).toEqual({ lat: 3, lon: 6 });
    expect(entities[3].metadata.geolocation_geolocation).toEqual({ lat: 3, lon: 6 });
  });
});
