"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration default-template', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(9);
  });

  it('should set a default template', async () => {
    await _index.default.up(_testing_db.default.mongodb);
    const templates = await _testing_db.default.mongodb.collection('templates').find().toArray();
    expect(templates[0].isEntity).not.toBeDefined();
    expect(templates[1].isEntity).not.toBeDefined();
    expect(templates[0].default).toBe(true);
  });
});