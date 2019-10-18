"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));

var _fixtures = _interopRequireDefault(require("./fixtures.js"));
var _index = _interopRequireDefault(require("../index.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration entities_override_mongo_language', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(1);
  });

  it('should migrate properly', done => {
    _index.default.up(_testing_db.default.mongodb).
    then(() => _testing_db.default.mongodb.collection('entities').find().toArray()).
    then(entities => {
      expect(entities.find(e => e.language === 'en').mongoLanguage).toBe('en');
      expect(entities.find(e => e.language === 'es').mongoLanguage).toBe('es');
      expect(entities.find(e => e.language === 'pt').mongoLanguage).toBe('pt');
      expect(entities.find(e => e.language === 'ar').mongoLanguage).toBe('none');
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });
});