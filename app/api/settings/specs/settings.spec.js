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

  describe('get()', () => {
    it('should return settings object', (done) => {
      settings.get()
      .then((result) => {
        expect(result.site_name).toBe('Uwazi');
        done();
      }).catch(catchErrors(done));
    });

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

  describe('save()', () => {
    it('should update the settings', (done) => {
      settings.get()
      .then((result) => {
        result.site_name = 'My collection';
        return settings.save(result);
      })
      .then(() => settings.get())
      .then((result) => {
        expect(result.site_name).toBe('My collection');
        done();
      }).catch(catchErrors(done));
    });
  });
});
