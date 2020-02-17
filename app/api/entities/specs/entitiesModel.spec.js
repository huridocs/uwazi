import { catchErrors } from '../../utils/jasmineHelpers';
import entitiesModel from '../entitiesModel';
import testingDB from '../../utils/testing_db';

describe('entitiesModel', () => {
  beforeEach(done => {
    testingDB
      .clearAllAndLoad({})
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should return the doc saved', done => {
    entitiesModel
      .save({ title: 'docES', language: 'es' })
      .then(saved => {
        expect(saved.title).toBe('docES');
        done();
      })
      .catch(catchErrors(done));
  });

  it('should return documents saved', done => {
    entitiesModel
      .saveMultiple([{ title: 'doc1' }, { title: 'doc2' }])
      .then(([saved1, saved2]) => {
        expect(saved1.title).toBe('doc1');
        expect(saved2.title).toBe('doc2');
        done();
      })
      .catch(catchErrors(done));
  });

  const expectUnsupportedLangToBeNone = done =>
    Promise.all([
      entitiesModel.get({ mongoLanguage: 'es' }),
      entitiesModel.get({ mongoLanguage: 'none' }),
      entitiesModel.get({ mongoLanguage: 'ar' }),
      entitiesModel.get({ mongoLanguage: 'ka' }),
      entitiesModel.get({ mongoLanguage: 'sr' }),
    ]).then(([es, none, ar, ka, sr]) => {
      expect(es.length).toBe(1);
      expect(none.length).toBe(3);
      expect(ar.length).toBe(0);
      expect(ka.length).toBe(0);
      expect(sr.length).toBe(0);
      done();
    });

  it('should set mongoLanguage to document passed', done => {
    Promise.all([
      entitiesModel.save({ title: 'docES', language: 'es' }),
      entitiesModel.save({ title: 'docAR', language: 'ar' }),
      entitiesModel.save({ title: 'docKA', language: 'ka' }),
      entitiesModel.save({ title: 'docSR', language: 'sr' }),
    ])
      .then(expectUnsupportedLangToBeNone.bind(null, done))
      .catch(catchErrors(done));
  });

  it('should set mongoLanguage when passing multiple documents', done => {
    entitiesModel
      .saveMultiple([
        { title: 'docES', language: 'es' },
        { title: 'unsupported ar language', language: 'ar' },
        { title: 'unsupported ka language', language: 'ka' },
        { title: 'unsupported sr language', language: 'sr' },
      ])
      .then(expectUnsupportedLangToBeNone.bind(null, done))
      .catch(catchErrors(done));
  });

  it('should do not set mongoLanguage when doc.language is undefined', done => {
    entitiesModel
      .save({ title: 'docES' })
      .then(saved => {
        expect(saved.mongoLanguage).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
  });
});
