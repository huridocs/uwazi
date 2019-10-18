"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _ = require("./..");
var _elastic_testing = _interopRequireDefault(require("../../utils/elastic_testing"));

var _fixturesInheritance = _interopRequireWildcard(require("./fixturesInheritance"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('search.searchGeolocations', () => {
  const elasticTesting = (0, _elastic_testing.default)('search.geolocation_index_test');
  const user = { _id: 'u1' };

  beforeAll(async () => {
    await _testing_db.default.clearAllAndLoad(_fixturesInheritance.default);
    await elasticTesting.reindex();
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  const cleanResults = results => results.rows.reduce((_memo, row) => {
    const memo = _memo;
    const { sharedId, metadata } = row;
    memo.push({ sharedId, metadata });
    return memo;
  }, []);

  it('should include all geolocation finds, inheriting metadata', async () => {
    const results = await _.search.searchGeolocations({ order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(cleanResults(results)).toMatchSnapshot();
  });

  it('should allow filtering as in normal search', async () => {
    const results = await _.search.searchGeolocations({ types: [_fixturesInheritance.ids.template3], order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(cleanResults(results)).toMatchSnapshot();
  });

  it('should not fetch unpublished inherited metadata if request is not authenticated', async () => {
    const results = await _.search.searchGeolocations({ types: [_fixturesInheritance.ids.template3], order: 'asc', sort: 'sharedId' }, 'en');
    const cleaned = cleanResults(results);
    const entity = cleaned.find(e => e.sharedId === 'entity_isLinkedToPrivateEntity');
    expect(entity).toBeFalsy();
    expect(results.rows.length).toBe(2);
    expect(results.totalRows).toBe(2);
  });

  it('should return empty results if there are no templates with geolocation fields', async () => {
    const tplWithoutGeolocation = _fixturesInheritance.default.templates.find(t => t._id === _fixturesInheritance.ids.template5);
    await _testing_db.default.mongodb.collection('templates').drop();
    await _testing_db.default.mongodb.collection('templates').insert(tplWithoutGeolocation);
    const results = await _.search.searchGeolocations({ order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(results.rows.length).toBe(0);
    expect(results.totalRows).toBe(0);
  });
});