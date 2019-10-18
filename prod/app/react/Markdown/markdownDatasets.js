"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _Parser = _interopRequireDefault(require("htmlparser2/lib/Parser"));
var _queryString = _interopRequireDefault(require("query-string"));
var _rison = _interopRequireDefault(require("rison"));
var _big = _interopRequireDefault(require("big.js"));

var _SearchAPI = _interopRequireDefault(require("../Search/SearchAPI"));
var _api = _interopRequireDefault(require("../utils/api"));
var _EntitiesAPI = _interopRequireDefault(require("../Entities/EntitiesAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let undefinedValue;

const conformUrl = ({ url = '', geolocation = false }) => {
  const { q } = _queryString.default.parse(url.substring(url.indexOf('?')));
  if (!q) {
    const defaultValue = { allAggregations: true, limit: 0 };
    if (geolocation) {
      defaultValue.geolocation = true;
    }

    return defaultValue;
  }

  const params = _rison.default.decode(q);
  params.limit = 0;

  if (geolocation) {
    params.geolocation = true;
  }

  return params;
};

const conformValues = attribs => attribs.entity ? attribs : conformUrl(attribs);

const parseDatasets = markdown => {
  const result = {};
  const parser = new _Parser.default({
    onopentag(name, attribs) {
      if (name === 'dataset') {
        result[attribs.name || 'default'] = conformValues(attribs);
      }
      if (name === 'query') {
        result[attribs.name || 'default'] = { url: attribs.url, query: true };
      }
    } },
  { decodeEntities: true });

  parser.parseComplete(markdown);
  return result;
};

const requestDatasets = (datasets, requestParams) => Promise.all(
Object.keys(datasets).
map(
name => {
  if (datasets[name].query) {
    return _api.default.get(datasets[name].url, requestParams).then(data => ({ data: data.json, name }));
  }
  const apiAction = datasets[name].entity ? _EntitiesAPI.default.get : _SearchAPI.default.search;
  const params = datasets[name].entity ? { sharedId: datasets[name].entity } : datasets[name];
  const postAction = datasets[name].entity ? d => d[0] : d => d;
  return apiAction(requestParams.set(params)).then(postAction).then(data => ({ data, name }));
}));



const conformDatasets = sets => sets.reduce((memo, set) => Object.assign({}, memo, { [set.name]: set.data }), {});

const getAggregations = (state, { property, dataset = 'default' }) => {
  const data = state.page.datasets.get(dataset);
  return !data ? undefinedValue : data.getIn(['aggregations', 'all', property, 'buckets']);
};

const addValues = (aggregations, values) => {
  let result = new _big.default(0);
  values.forEach(key => {
    const value = aggregations.find(bucket => bucket.get('key') === key);
    const filteredValue = value ? value.getIn(['filtered', 'doc_count']) : 0;
    result = result.plus(filteredValue || 0);
  });
  return Number(result);
};var _default =

{
  async fetch(markdown, requestParams) {
    const datasets = parseDatasets(markdown);
    return requestDatasets(datasets, requestParams).then(conformDatasets);
  },

  getRows(state, { dataset = 'default' }) {
    const data = state.page.datasets.get(dataset);
    if (!data) {return undefinedValue;}
    return data.get('rows');
  },

  getAggregations,

  getAggregation(state, { uniqueValues, property, value, dataset = 'default' }) {
    const aggregations = getAggregations(state, { property, dataset });
    if (!aggregations) {
      return undefinedValue;
    }

    if (uniqueValues) {
      return aggregations.filter(a => a.getIn(['filtered', 'doc_count']) !== 0).size;
    }

    const values = value ? value.split(',') : [''];
    return addValues(aggregations, values);
  },

  getMetadataValue(state, { property, dataset = 'default' }) {
    const data = state.page.datasets.get(dataset);
    return !data ? undefinedValue : Number(data.getIn(['metadata', property]));
  } };exports.default = _default;