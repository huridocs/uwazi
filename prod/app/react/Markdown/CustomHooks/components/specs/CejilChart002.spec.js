"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _SearchAPI = _interopRequireDefault(require("../../../../Search/SearchAPI"));
var _CejilChart = _interopRequireWildcard(require("../CejilChart002"));
var _CejilChart2 = require("../CejilChart");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('CejilChart002', () => {
  let props;

  function conformAggregations(count) {
    const response = { aggregations: { all: {} } };
    response.aggregations.all[_CejilChart2.countryKey] = { buckets: [
      { key: 'keyA', filtered: { doc_count: count.a } },
      { key: 'keyB', filtered: { doc_count: count.b } },
      { key: 'missing', filtered: { doc_count: 1 } }] };

    return response;
  }

  function testSnapshot() {
    const tree = (0, _enzyme.shallow)(_react.default.createElement(_CejilChart.default.WrappedComponent, props));
    expect(tree).toMatchSnapshot();
  }

  function testQuery(args, sex) {
    return args.types[0] === _CejilChart.judgesCommisionersTemplate && args.filters.sexo && args.filters.sexo.values[0] === sex;
  }

  beforeEach(() => {
    props = (0, _CejilChart.mapStateToProps)({
      thesauris: (0, _immutable.fromJS)([
      { _id: _CejilChart2.countriesTemplate, values: [{ id: 'keyA', label: 'labelA' }, { id: 'keyB', label: 'labelB' }] },
      { _id: 'otherThesauri' }]) },

    {});
  });

  describe('When no data loaded', () => {
    it('should output only the loader before loading data', () => {
      spyOn(_SearchAPI.default, 'search').and.returnValue(Promise.resolve(null));
      testSnapshot();
    });
  });

  describe('When data loaded', () => {
    beforeEach(() => {
      spyOn(_SearchAPI.default, 'search').and.callFake(args => {
        const combinedQuery = args.types[0] === _CejilChart.judgesCommisionersTemplate && !args.filters.sexo;
        const maleQuery = testQuery(args, _CejilChart.male);
        const femaleQuery = testQuery(args, _CejilChart.female);

        let count = {};

        if (combinedQuery) {
          count = { a: 5, b: 8 };
          if (Object.keys(args.filters).indexOf('mandatos_de_la_corte') !== 0) {
            count = { a: 6, b: 9 };
          }
        }

        if (maleQuery) {
          count = { a: 3, b: 1 };
        }

        if (femaleQuery) {
          count = { a: 2, b: 7 };
        }

        if (combinedQuery || maleQuery || femaleQuery) {
          return conformAggregations(count);
        }

        fail(`Unexpected call: ${JSON.stringify(args)}`);
        return Promise.resolve();
      });
    });

    it('should sort and format the results appropriately', done => {
      const tree = (0, _enzyme.shallow)(_react.default.createElement(_CejilChart.default.WrappedComponent, props));
      setImmediate(() => {
        tree.update();
        expect(tree).toMatchSnapshot();
        done();
      }, 0);
    });

    it('should allow changing the filter property', done => {
      props.filterProperty = 'mandatos_de_la_comisi_n';
      const tree = (0, _enzyme.shallow)(_react.default.createElement(_CejilChart.default.WrappedComponent, props));
      setImmediate(() => {
        tree.update();
        expect(tree).toMatchSnapshot();
        done();
      }, 0);
    });
  });
});