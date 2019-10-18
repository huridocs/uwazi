"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _elastic_testing = _interopRequireDefault(require("../../utils/elastic_testing"));
var _date = _interopRequireDefault(require("../../utils/date"));

var _fixtures_elastic = _interopRequireWildcard(require("./fixtures_elastic"));
var _elastic = _interopRequireDefault(require("../elastic"));
var _search = _interopRequireDefault(require("../search"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('dates filters search', () => {
  const elasticTesting = (0, _elastic_testing.default)('search_dates_index_test');

  beforeAll(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures_elastic.default);
    await elasticTesting.reindex();
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  it('should request all unpublished entities or documents for the user', async () => {
    spyOn(_date.default, 'descriptionToTimestamp').and.returnValue('timestamp!');
    spyOn(_elastic.default, 'search').and.returnValue(Promise.resolve({ hits: { hits: [] }, aggregations: { all: {} } }));

    await _search.default.search(
    {
      types: [_fixtures_elastic.ids.template1],
      filters: {
        date: { to: 'dateto', from: 'datefrom' },
        multidate: { to: 'dateto', from: 'datefrom' },
        daterange: { to: 'dateto', from: 'datefrom' },
        multidaterange: { to: 'dateto', from: 'datefrom' } } },


    'en');


    expect(_elastic.default.search.calls.argsFor(0)[0].body.query.bool.filter[3]).toMatchSnapshot();
    expect(_elastic.default.search.calls.argsFor(0)[0].body.query.bool.filter[4]).toMatchSnapshot();
    expect(_elastic.default.search.calls.argsFor(0)[0].body.query.bool.filter[5]).toMatchSnapshot();
    expect(_elastic.default.search.calls.argsFor(0)[0].body.query.bool.filter[6]).toMatchSnapshot();
  });
});