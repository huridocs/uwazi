import { catchErrors } from '../../utils/jasmineHelpers';
import entitiesModel from '../entitiesModel';
import testingDB from '../../utils/testing_db';

describe('entitiesModel', () => {
  beforeEach((done) => {
    testingDB.clearAllAndLoad({}).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should set mongoLanguage to document passed', (done) => {
    Promise.all([
      entitiesModel.save({ title: 'docES', language: 'es' }),
      entitiesModel.save({ title: 'docAR', language: 'ar' })
    ])
    .then(() => Promise.all([
        entitiesModel.get({ mongoLanguage: 'es' }),
        entitiesModel.get({ mongoLanguage: 'none' }),
        entitiesModel.get({ mongoLanguage: 'ar' })
    ]))
    .then(([es, none, ar]) => {
      expect(es.length).toBe(1);
      expect(none.length).toBe(1);
      expect(ar.length).toBe(0);
      done();
    });
  });

  it('should set mongoLanguage when passing multiple documents', (done) => {
    entitiesModel.save([
      { title: 'docES', language: 'es' },
      { title: 'unsuported ar language', language: 'ar' }
    ])
    .then(() => Promise.all([
        entitiesModel.get({ mongoLanguage: 'es' }),
        entitiesModel.get({ mongoLanguage: 'none' }),
        entitiesModel.get({ mongoLanguage: 'ar' })
    ]))
    .then(([es, none, ar]) => {
      expect(es.length).toBe(1);
      expect(none.length).toBe(1);
      expect(ar.length).toBe(0);
      done();
    });
  });
});
