"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.sexTranslationsContext = exports.female = exports.male = exports.countryKey = exports.judgesCommisionersTemplate = void 0;var _reactRedux = require("react-redux");

var _SearchAPI = _interopRequireDefault(require("../../../Search/SearchAPI"));
var _I18N = require("../../../I18N");

var _CejilChart = _interopRequireDefault(require("./CejilChart"));
var _parsingUtils = _interopRequireDefault(require("../utils/parsingUtils"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const judgesCommisionersTemplate = '58b2f3a35d59f31e1345b4b6';exports.judgesCommisionersTemplate = judgesCommisionersTemplate;
const countryKey = 'pa_s';exports.countryKey = countryKey;
const male = 'dedcc624-0e11-4d4e-90d5-d1c0ea4c7a18';exports.male = male;
const female = 'f2457229-e142-4b74-b595-2ac2f9b5f64e';exports.female = female;
const sexTranslationsContext = '58b2f3a35d59f31e1345b52d';exports.sexTranslationsContext = sexTranslationsContext;

function assignFilter(filters, sex) {
  return Object.assign({}, filters, { sexo: { values: [sex] } });
}

function conformSearchQuery(filters) {
  return _SearchAPI.default.search({ types: [judgesCommisionersTemplate], filters, limit: 0 });
}

function getData() {
  const filters = {};
  filters[this.props.filterProperty] = { from: -2208988800 };

  const maleFilters = assignFilter(filters, male);
  const femaleFilters = assignFilter(filters, female);

  return Promise.all([filters, maleFilters, femaleFilters].map(conformSearchQuery));
}

function prepareData(countries, setA, setB) {
  return countries.map(_country => {
    const country = _country;
    const maleResults = _parsingUtils.default.findBucketsByCountry(setA, countryKey, country.key);
    const femaleResults = _parsingUtils.default.findBucketsByCountry(setB, countryKey, country.key);

    country.name = country.label;

    country.setALabel = (0, _I18N.t)(sexTranslationsContext, 'Hombre', null, false);
    country.setAValue = maleResults ? maleResults.filtered.doc_count : 0;

    country.setBLabel = (0, _I18N.t)(sexTranslationsContext, 'Mujer', null, false);
    country.setBValue = femaleResults ? femaleResults.filtered.doc_count : 0;

    return country;
  });
}

function mapStateToProps({ thesauris }, { filterProperty = 'mandatos_de_la_corte' }) {
  return { thesauris, getData, prepareData, filterProperty };
}var _default =

(0, _reactRedux.connect)(mapStateToProps)(_CejilChart.default);exports.default = _default;