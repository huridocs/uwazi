"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration page-languages', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(8);
  });

  it('should remove duplicated relationships, sharedIds and languages', async () => {
    await _index.default.up(_testing_db.default.mongodb);
    const pages = await _testing_db.default.mongodb.collection('pages').find().toArray();
    expect(pages.length).toBe(4);
    const pagesInES = pages.filter(p => p.language === 'es');
    const pagesInPT = pages.filter(p => p.language === 'pt');
    expect(pagesInES.length).toBe(2);
    expect(pagesInPT.length).toBe(2);
  });
});