import testingDB from 'api/utils/testing_db';
import logger from 'api/migrations/logger.js';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration sanitize-string-geolocations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);

    jest.spyOn(logger, 'logFieldParseError').mockImplementation(() => {});
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(25);
  });

  it('should leave unchanged correct geolocations and other fields', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[0].metadata.geolocation_geolocation[0].value.lat).toBe(1.1);
    expect(entities[0].metadata.geolocation_geolocation[0].value.lon).toBe(-2.2);
    expect(entities[0].metadata.text[0].value).toBe('text');
  });

  it('should correctly fix string formated floats', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[1].metadata.geolocation_geolocation[0].value.lat).toBe(1.1);
    expect(entities[1].metadata.geolocation_geolocation[0].value.lon).toBe(-2.2);
  });

  it('should unset non-parsable values', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[2].metadata.geolocation_geolocation).toEqual([]);
    expect(logger.logFieldParseError).toHaveBeenCalledWith(
      {
        template: fixtures.entities[2].template,
        sharedId: fixtures.entities[2].sharedId,
        title: fixtures.entities[2].title,
        propertyName: 'geolocation_geolocation',
        value: fixtures.entities[2].metadata.geolocation_geolocation,
      },
      migration.name
    );
  });

  it('should leave the field untouched if its value is empty or not defined', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[3].metadata.geolocation_geolocation).toEqual([]);
    expect(entities[4].metadata.geolocation_geolocation).toBe(null);
  });
});
