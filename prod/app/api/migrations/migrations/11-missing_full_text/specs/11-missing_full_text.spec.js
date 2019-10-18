"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration missing_full_text', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(11);
  });

  it('should copy fulltext for entities with files from the default language', async () => {
    await _index.default.up(_testing_db.default.mongodb);
    const entities = await _testing_db.default.mongodb.collection('entities').find({ language: 'pt' }).toArray();
    expect(entities[0].fullText).toBe('some full text');
  });
});