import {db_url as dbURL} from 'api/config/database.js';
import database from 'api/utils/database.js';

import translations from '../translations.js';
import fixtures from './fixtures.js';

import {catchErrors} from 'api/utils/jasmineHelpers';

describe('translations', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('get()', () => {
    it('should return the translations', (done) => {
      translations.get()
      .then((result) => {
        expect(result.rows.length).toBe(2);
        expect(result.rows[0].locale).toBe('en');
        expect(result.rows[1].locale).toBe('es');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('save()', () => {
    it('should save the translation and return it', (done) => {
      translations.save({locale: 'fr'})
      .then((result) => {
        expect(result._id).toBeDefined();
        expect(result.type).toBe('translation');
        done();
      }).catch(catchErrors(done));
    });
  });
});
