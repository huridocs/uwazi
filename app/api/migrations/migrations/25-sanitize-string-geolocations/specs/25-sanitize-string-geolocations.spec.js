import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration sanitize-string-geolocations', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(25);
  });

  it('should leave unchanged correct geolocations and other fields', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb
      .collection('entities')
      .find()
      .toArray();

    expect(entities[0].metadata.geolocation_geolocation[0].value.lat).toBe(1.1);
    expect(entities[0].metadata.geolocation_geolocation[0].value.lon).toBe(-2.2);
    expect(entities[0].metadata.text[0].value).toBe('text');
  });

  it('should correctly fix string formated floats', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb
      .collection('entities')
      .find()
      .toArray();

    expect(entities[1].metadata.geolocation_geolocation[0].value.lat).toBe(1.1);
    expect(entities[1].metadata.geolocation_geolocation[0].value.lon).toBe(-2.2);
  });

  it('should zero out non-parsable values', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb
      .collection('entities')
      .find()
      .toArray();

    expect(entities[2].metadata.geolocation_geolocation[0].value.lat).toBe(0);
    expect(entities[2].metadata.geolocation_geolocation[0].value.lon).toBe(0);
  });
});
