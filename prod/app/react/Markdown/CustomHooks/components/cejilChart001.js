"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _reactRedux = require("react-redux");

var _SearchAPI = _interopRequireDefault(require("../../../Search/SearchAPI"));
var _I18N = require("../../../I18N");

var _CejilChart = _interopRequireDefault(require("./CejilChart"));
var _parsingUtils = _interopRequireDefault(require("../utils/parsingUtils"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const casesTemplate = '58b2f3a35d59f31e1345b48a';
const provisionalMeasuresTemplate = '58b2f3a35d59f31e1345b4a4';
const countryKey = 'pa_s';

function conformSearchQuery(types) {
  return _SearchAPI.default.search({ types, limit: 0 });
}

function getData() {
  const types = [[casesTemplate, provisionalMeasuresTemplate], [casesTemplate], [provisionalMeasuresTemplate]];
  return Promise.all(types.map(conformSearchQuery));
}

function prepareData(countries, setA, setB) {
  const caseTemptale = this.props.templates.find(template => template.get('_id') === casesTemplate);
  const caseLabel = (0, _I18N.t)(casesTemplate, caseTemptale.get('name'), null, false);

  const provisionalMeasureTemplate = this.props.templates.find(template => template.get('_id') === provisionalMeasuresTemplate);
  const provisionalMeasureLabel = (0, _I18N.t)(provisionalMeasuresTemplate, provisionalMeasureTemplate.get('name'), null, false);

  return countries.map(_country => {
    const country = _country;
    const caseResults = _parsingUtils.default.findBucketsByCountry(setA, countryKey, country.key);
    const provisionalMeasureResults = _parsingUtils.default.findBucketsByCountry(setB, countryKey, country.key);

    country.name = country.label;

    country.setALabel = caseLabel;
    country.setAValue = caseResults ? caseResults.filtered.doc_count : 0;

    country.setBLabel = provisionalMeasureLabel;
    country.setBValue = provisionalMeasureResults ? provisionalMeasureResults.filtered.doc_count : 0;

    return country;
  });
}

function mapStateToProps({ templates, thesauris }) {
  return { templates, thesauris, getData, prepareData };
}var _default =

(0, _reactRedux.connect)(mapStateToProps)(_CejilChart.default);exports.default = _default;