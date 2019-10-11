import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration geolocation_fields', () => {
  beforeEach((done) => {
    spyOn(process.stdout, 'write');
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(5);
  });

  it('should set the geolocation values to all documents', (done) => {
    migration.up(testingDB.mongodb)
    .then(() => testingDB.mongodb.collection('entities').find().toArray())
    .then((entities) => {
      expect(entities[0].metadata.geolocation_geolocation).toEqual({ lat: 5, lon: 8 });
      expect(entities[1].metadata.geolocation_geolocation).toEqual({ lat: 5, lon: 8 });
      expect(entities[2].metadata.geolocation_geolocation).toEqual({ lat: 3, lon: 6 });
      expect(entities[3].metadata.geolocation_geolocation).toEqual({ lat: 3, lon: 6 });
      done();
    })
    .catch(catchErrors(done));
  });
});
