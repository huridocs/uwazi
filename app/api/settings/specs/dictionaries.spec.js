import {db_url as dbURL} from 'api/config/database.js';
import database from 'api/utils/database.js';

import dictionaries from '../dictionaries.js';
import fixtures from './fixtures.js';

import {catchErrors} from 'api/utils/jasmineHelpers';

describe('dictionaries', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('get()', () => {
    it('should return the dictionaries', (done) => {
      dictionaries.get()
      .then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].locale).toBe('en');
        expect(result[1].locale).toBe('es');
        done();
      }).catch(catchErrors(done));
    });
  });
});
