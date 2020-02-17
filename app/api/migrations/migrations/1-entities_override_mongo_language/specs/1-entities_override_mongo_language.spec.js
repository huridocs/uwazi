import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';

import fixtures from './fixtures.js';
import migration from '../index.js';

describe('migration entities_override_mongo_language', () => {
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
    expect(migration.delta).toBe(1);
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
        expect(entities.find(e => e.language === 'en').mongoLanguage).toBe('en');
        expect(entities.find(e => e.language === 'es').mongoLanguage).toBe('es');
        expect(entities.find(e => e.language === 'pt').mongoLanguage).toBe('pt');
        expect(entities.find(e => e.language === 'ar').mongoLanguage).toBe('none');
        done();
      })
      .catch(catchErrors(done));
  });
});
