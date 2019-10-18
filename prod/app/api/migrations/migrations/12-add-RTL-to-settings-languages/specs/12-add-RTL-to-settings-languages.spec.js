"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration add-RTL-to-settings-languages', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(12);
  });

  it('should add RTL to settings languages', async () => {
    await _index.default.up(_testing_db.default.mongodb);
    const [{ languages }] = await _testing_db.default.mongodb.collection('settings').find({}).toArray();

    const rtlLanguages = languages.filter(l => l.rtl);

    expect(languages.length).toBe(24);
    expect(rtlLanguages.length).toBe(10);

    rtlLanguages.forEach(language => {
      expect(_index.default.rtlLanguagesList).toContain(language.key);
    });
  });

  it('should not affect other settings', async () => {
    await _index.default.up(_testing_db.default.mongodb);
    const settingsCollection = await _testing_db.default.mongodb.collection('settings').find({}).toArray();
    expect(settingsCollection.length).toBe(1);

    const [{ otherProperty }] = settingsCollection;
    expect(otherProperty).toBe('test');
  });
});