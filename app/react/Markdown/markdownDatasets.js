import HtmlParser from 'htmlparser2/lib/Parser';
import queryString from 'query-string';
import rison from 'rison';

import api from 'app/Search/SearchAPI';

let undefinedValue;

const conformUrl = ({ url = '', geolocation = false }) => {
  const { q } = queryString.parse(url.substring(url.indexOf('?')));
  if (!q) {
    const defaultValue = { allAggregations: true, limit: 0 };
    if (geolocation) {
      defaultValue.geolocation = true;
    }

    return defaultValue;
  }
  const params = rison.decode(q);
  params.limit = 0;

  if (geolocation) {
    params.geolocation = true;
  }

  return params;
};

const parseDatasets = (markdown) => {
  const result = {};
  const parser = new HtmlParser({
      onopentag(name, attribs) {
      if (name === 'dataset') {
        result[attribs.name || 'default'] = conformUrl(attribs);
      }
    }
  }, { decodeEntities: true });

  parser.parseComplete(markdown);
  return result;
};

const requestDatasets = datasets => Promise.all(
  Object.keys(datasets).map(name => api.search(datasets[name])
  .then(searchData => ({ data: searchData, name })))
);

const conformDatasets = sets => sets.reduce((memo, set) => Object.assign({}, memo, { [set.name]: set.data }), {});

const getAggregations = (state, { property, dataset = 'default' }) => {
  const data = state.page.datasets.get(dataset);
  if (!data) {
    return undefinedValue;
  }

  return data.getIn(['aggregations', 'all', property, 'buckets']);
};

export default {
  async fetch(markdown) {
    const datasets = parseDatasets(markdown);
    return requestDatasets(datasets).then(conformDatasets);
  },

  getRows(state, { dataset = 'default' }) {
    const data = state.page.datasets.get(dataset);
    if (!data) { return undefinedValue; }
    return data.get('rows');
  },

  getAggregations,

  getAggregation(state, { property, value, dataset = 'default' }) {
    const aggregations = getAggregations(state, { property, dataset });
    return aggregations ? aggregations.find(bucket => bucket.get('key') === value).getIn(['filtered', 'doc_count']) : undefinedValue;
  },
};
