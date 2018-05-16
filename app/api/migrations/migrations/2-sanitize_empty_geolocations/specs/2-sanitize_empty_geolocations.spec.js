import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration sanitize_empty_geolocations', () => {
  beforeEach((done) => {
    spyOn(process.stdout, 'write');
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(2);
  });

  it('should migrate properly', (done) => {
    migration.up(testingDB.mongodb)
    .then(() => testingDB.mongodb.collection('entities').find().toArray())
    .then((entities) => {
      expect(entities.find(e => e.metadata.description === 'one').metadata.geolocation_geolocation)
      .toBeUndefined();
      expect(entities.find(e => e.metadata.description === 'two').metadata.geolocation_geolocation)
      .toBeUndefined();
      done();
    })
    .catch(catchErrors(done));
  });
});
