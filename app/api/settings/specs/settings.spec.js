import settings from '../settings.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('settings', () => {

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('save()', () => {
    it('should save the settings', (done) => {
      let config = {site_name: 'My collection'};
      settings.save(config)
      .then(() => {
        return settings.get();
      })
      .then((result) => {
        expect(result.site_name).toBe('My collection');
        expect(result.type).toBe('settings');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('get()', () => {
    describe('if there is no settings on the DB', () => {
      it('should return an empty object', (done) => {
        database.reset_testing_database()
        .then(() => database.import({}))
        .then(() => settings.get())
        .then((result) => {
          expect(result).toEqual({});
          done();
        }).catch(catchErrors(done));
      });
    });
  });
});
