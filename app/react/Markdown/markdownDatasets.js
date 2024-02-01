import { Parser as HTMLParser } from 'htmlparser2';
import qs from 'qs';
import { risonDecodeOrIgnore } from 'app/utils';
import Big from 'big.js';

import searchApi from 'app/Search/SearchAPI';
import api from 'app/utils/api';
import entitiesApi from 'app/Entities/EntitiesAPI';

const conformUrl = ({ url = '', geolocation = false }) => {
  const { q } = qs.parse(url.substring(url.indexOf('?')), { ignoreQueryPrefix: true });

  if (!q) {
    const defaultValue = geolocation
      ? { allAggregations: true, limit: 0, geolocation: true }
      : { allAggregations: true, limit: 0 };

    return defaultValue;
  }

  const params = risonDecodeOrIgnore(q);
  params.limit = 0;

  if (geolocation) {
    params.geolocation = true;
  }

  return params;
};

const conformValues = attribs => (attribs.entity ? attribs : conformUrl(attribs));

const parseDatasets = markdown => {
  const result = {};
  const parser = new HTMLParser(
    {
      onopentag(name, attribs) {
        if (name === 'dataset') {
          result[attribs.name || 'default'] = conformValues(attribs);
        }
        if (name === 'query') {
          result[attribs.name || 'default'] = { url: attribs.url, query: true };
        }
      },
    },
    { decodeEntities: true }
  );

  parser.parseComplete(markdown);
  return result;
};

const requestDatasets = (datasets, requestParams) =>
  Promise.all(
    Object.keys(datasets).map(name => {
      if (datasets[name].query) {
        return api
          .get(datasets[name].url, requestParams)
          .then(data => ({ data: data.json, name, params: datasets[name] }));
      }
      const apiAction = datasets[name].entity ? entitiesApi.get : searchApi.search;
      const params = datasets[name].entity ? { sharedId: datasets[name].entity } : datasets[name];
      const postAction = datasets[name].entity ? d => d[0] : d => d;
      return apiAction(requestParams.set(params))
        .then(postAction)
        .then(data => ({ data, name, params: datasets[name] }));
    })
  );

const conformDatasets = sets =>
  sets.reduce((memo, set) => {
    const data = set.params.extractFirstRow ? set.data.rows[0] : set.data;
    return { ...memo, [set.name]: data };
  }, {});

const getAggregations = (state, { property, dataset = 'default' }) => {
  const data = state.page.datasets.get(dataset);
  return !data ? undefined : data.getIn(['aggregations', 'all', property, 'buckets']);
};

const addValues = (aggregations, values) => {
  let result = new Big(0);
  values.forEach(key => {
    const value = aggregations.find(bucket => bucket.get('key') === key);
    const filteredValue = value ? value.getIn(['filtered', 'doc_count']) : 0;
    result = result.plus(filteredValue || 0);
  });
  return Number(result);
};

export default {
  async fetch(markdown, requestParams, { additionalDatasets = {} } = {}) {
    const datasets = parseDatasets(markdown);
    const extendedDatsets = { ...datasets, ...additionalDatasets };
    return requestDatasets(extendedDatsets, requestParams).then(conformDatasets);
  },

  getRows(state, { dataset = 'default' }) {
    const data = state.page.datasets.get(dataset);
    if (!data) {
      return undefined;
    }
    return data.get('rows');
  },

  getAggregations,

  getAggregation(state, { uniqueValues, property, value, dataset = 'default' }) {
    const aggregations = getAggregations(state, { property, dataset });
    if (!aggregations) {
      return undefined;
    }

    if (uniqueValues) {
      return aggregations.filter(a => a.getIn(['filtered', 'doc_count']) !== 0).size;
    }

    const values = value ? value.split(',') : [''];
    return addValues(aggregations, values);
  },

  getMetadataValue(state, { property, dataset = 'default' }) {
    const data = state.page.datasets.get(dataset);
    const propertyExists = data && data.hasIn(['metadata', property]);
    const mos = propertyExists ? data.getIn(['metadata', property]).toJS() : [];
    return mos && mos.length && mos[0].value ? Number(mos[0].value) : undefined;
  },
};
