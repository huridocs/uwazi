import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration sanitize_empty_geolocations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(2);
  });

  it('should migrate properly', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    const doc1 = entities.find(e => e.title === 'doc1');
    expect(doc1.metadata.description).toBe('one');
    expect(doc1.metadata.geolocation_geolocation).toBeUndefined();

    const doc2 = entities.find(e1 => e1.title === 'doc2');
    expect(doc2.metadata).toEqual({
      description: 'two',
      data_geolocation: { lat: 5, lon: 8 },
    });

    const doc3 = entities.find(e2 => e2.title === 'doc3');
    expect(doc3.metadata).toBeUndefined();
  });
});
