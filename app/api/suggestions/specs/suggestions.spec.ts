import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';

import suggestions from '../suggestions';
import fixtures from './fixtures.js';

describe('suggestions', () => {
  beforeEach(done => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('deleteByProperty()', () => {
    it('should delete all suggestions of a given property', async () => {});
  });
});
