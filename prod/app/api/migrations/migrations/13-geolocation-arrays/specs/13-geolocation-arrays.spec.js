"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration geolocation-arrays', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(13);
  });

  it('should replace every geolocation metadata value with an array ommiting already migrated data', async () => {
    await _index.default.up(_testing_db.default.mongodb);

    const entities = await _testing_db.default.mongodb.collection('entities').
    find({}, { projection: { template: false, _id: false }, sort: { title: 1 } }).
    toArray();

    expect(entities).toMatchSnapshot();
  });
});