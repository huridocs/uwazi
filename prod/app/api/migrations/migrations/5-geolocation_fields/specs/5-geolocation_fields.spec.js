"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration geolocation_fields', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(5);
  });

  it('should set the geolocation values to all documents', done => {
    _index.default.up(_testing_db.default.mongodb).
    then(() => _testing_db.default.mongodb.collection('entities').find().toArray()).
    then(entities => {
      expect(entities[0].metadata.geolocation_geolocation).toEqual({ lat: 5, lon: 8 });
      expect(entities[1].metadata.geolocation_geolocation).toEqual({ lat: 5, lon: 8 });
      expect(entities[2].metadata.geolocation_geolocation).toEqual({ lat: 3, lon: 6 });
      expect(entities[3].metadata.geolocation_geolocation).toEqual({ lat: 3, lon: 6 });
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });
});