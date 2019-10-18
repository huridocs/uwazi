"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration sanitize_empty_geolocations', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(2);
  });

  it('should migrate properly', done => {
    _index.default.up(_testing_db.default.mongodb).
    then(() => _testing_db.default.mongodb.collection('entities').find().toArray()).
    then(entities => {
      const doc1 = entities.find(e => e.title === 'doc1');
      expect(doc1.metadata.description).toBe('one');
      expect(doc1.metadata.geolocation_geolocation).toBeUndefined();

      const doc2 = entities.find(e => e.title === 'doc2');
      expect(doc2.metadata.description).toBe('two');
      expect(doc2.metadata.geolocation_geolocation).toBeUndefined();
      expect(doc2.metadata.other_geolocation).toBeUndefined();
      expect(doc2.metadata.data_geolocation).toEqual({ lat: 5, lon: 8 });

      const doc3 = entities.find(e => e.title === 'doc3');
      expect(doc3.metadata).toBeUndefined();

      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done));
  });
});