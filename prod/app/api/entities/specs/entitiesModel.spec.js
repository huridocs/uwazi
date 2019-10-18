"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _entitiesModel = _interopRequireDefault(require("../entitiesModel"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('entitiesModel', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad({}).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should return the doc saved', done => {
    _entitiesModel.default.save({ title: 'docES', language: 'es' }).
    then(saved => {
      expect(saved.title).toBe('docES');
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });

  it('should return documents saved', done => {
    _entitiesModel.default.save([
    { title: 'doc1' },
    { title: 'doc2' }]).

    then(([saved1, saved2]) => {
      expect(saved1.title).toBe('doc1');
      expect(saved2.title).toBe('doc2');
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });

  const expectUnsupportedLangToBeNone = done => Promise.all([
  _entitiesModel.default.get({ mongoLanguage: 'es' }),
  _entitiesModel.default.get({ mongoLanguage: 'none' }),
  _entitiesModel.default.get({ mongoLanguage: 'ar' }),
  _entitiesModel.default.get({ mongoLanguage: 'ka' }),
  _entitiesModel.default.get({ mongoLanguage: 'sr' })]).

  then(([es, none, ar, ka, sr]) => {
    expect(es.length).toBe(1);
    expect(none.length).toBe(3);
    expect(ar.length).toBe(0);
    expect(ka.length).toBe(0);
    expect(sr.length).toBe(0);
    done();
  });


  it('should set mongoLanguage to document passed', done => {
    Promise.all([
    _entitiesModel.default.save({ title: 'docES', language: 'es' }),
    _entitiesModel.default.save({ title: 'docAR', language: 'ar' }),
    _entitiesModel.default.save({ title: 'docKA', language: 'ka' }),
    _entitiesModel.default.save({ title: 'docSR', language: 'sr' })]).

    then(expectUnsupportedLangToBeNone.bind(null, done)).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });

  it('should set mongoLanguage when passing multiple documents', done => {
    _entitiesModel.default.save([
    { title: 'docES', language: 'es' },
    { title: 'unsupported ar language', language: 'ar' },
    { title: 'unsupported ka language', language: 'ka' },
    { title: 'unsupported sr language', language: 'sr' }]).

    then(expectUnsupportedLangToBeNone.bind(null, done)).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });

  it('should do not set mongoLanguage when doc.language is undefined', done => {
    _entitiesModel.default.save({ title: 'docES' }).
    then(saved => {
      expect(saved.mongoLanguage).not.toBeDefined();
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });
});