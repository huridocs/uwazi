import queryString from 'query-string';
import rison from 'rison';

import HtmlParser from 'htmlparser2/lib/Parser';
import api from 'app/Search/SearchAPI';

const conformUrl = (url = '') => {
  const { q } = queryString.parse(url.substring(url.indexOf('?')));
  if (!q) {
    return { allAggregations: true, limit: 0 };
  }
  const params = rison.decode(q);
  params.limit = 0;
  return params;
};

const parseDatasets = (markdown) => {
  const result = {};
  const parser = new HtmlParser({
      onopentag(name, attribs) {
      if (name === 'dataset') {
        result[attribs.name || 'default'] = conformUrl(attribs.url);
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

export default {
  async fetch(markdown) {
    const datasets = parseDatasets(markdown);

    return requestDatasets(datasets).then(conformDatasets);
  }
};
