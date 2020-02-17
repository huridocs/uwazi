import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration sanitize_empty_geolocations', () => {
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
    expect(migration.delta).toBe(2);
  });

  it('should migrate properly', done => {
    migration
      .up(testingDB.mongodb)
      .then(() =>
        testingDB.mongodb
          .collection('entities')
          .find()
          .toArray()
      )
      .then(entities => {
        const doc1 = entities.find(e => e.title === 'doc1');
        expect(doc1.metadata.description).toBe('one');
        expect(doc1.metadata.geolocation_geolocation).toBeUndefined();

        const doc2 = entities.find(e => e.title === 'doc2');
        expect(doc2.metadata.description).toBe('two');
        expect(doc2.metadata.geolocation_geolocation).toBeUndefined();
        expect(doc2.metadata.other_geolocation).toBeUndefined();
        expect(doc2.metadata.data_geolocation).toEqual({ lat: 5, lon: 8 });

        const doc3 = entities.find(e => e.title === 'doc3');
        expect(doc3.metadata).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
  });
});
