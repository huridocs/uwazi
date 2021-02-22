import HtmlParser from 'htmlparser2';
import queryString from 'query-string';
//rison-node types are not correct and cannot be imported
//--> https://github.com/w33ble/rison-node/issues/1)
//@ts-ignore
import rison from 'rison-node';
import Big from 'big.js';

import searchApi from 'app/Search/SearchAPI';
import api from 'app/utils/api';
import entitiesApi from 'app/Entities/EntitiesAPI';
import { RequestParams } from 'app/utils/RequestParams';

type AggregationValues = {
  uniqueValues?: string;
  property?: string;
  value?: string;
  dataset?: string;
};

const conformUrl = ({ url = '', geolocation = false }) => {
  const { q } = queryString.parse(url.substring(url.indexOf('?')));

  if (!q) {
    const defaultValue = geolocation
      ? { allAggregations: true, limit: 0, geolocation: true }
      : { allAggregations: true, limit: 0 };

    return defaultValue;
  }

  const params = rison.decode(q);
  params.limit = 0;

  if (geolocation) {
    params.geolocation = true;
  }

  return params;
};

const conformValues = (attribs: { [key: string]: string }) =>
  attribs.entity ? attribs : conformUrl(attribs);

const parseDatasets = (markdown: string) => {
  const result: { [key: string]: { [key: string]: string | {} } } = {};
  const parser = new HtmlParser.Parser(
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

const requestDatasets = async (
  datasets: {
    [key: string]: { [key: string]: string | {} };
  },
  requestParams: RequestParams
) =>
  Promise.all(
    Object.keys(datasets).map(name => {
      if (datasets[name].query) {
        return api
          .get(datasets[name].url, requestParams)
          .then((data: { json: any }) => ({ data: data.json, name }));
      }
      const apiAction = datasets[name].entity ? entitiesApi.get : searchApi.search;
      const params = datasets[name].entity ? { sharedId: datasets[name].entity } : datasets[name];
      const postAction = datasets[name].entity ? (d: string[]) => d[0] : (d: string) => d;
      return apiAction(requestParams.set(params))
        .then(postAction)
        .then((data: { json: any }) => ({ data, name }));
    })
  );

const conformDatasets = (sets: any[]) =>
  sets.reduce((memo, set) => ({ ...memo, [set.name]: set.data }), {});

const getAggregations = (state: any, { property, dataset = 'default' }: AggregationValues) => {
  const data = state.page.datasets.get(dataset);
  return !data ? undefined : data.getIn(['aggregations', 'all', property, 'buckets']);
};

const addValues = (aggregations: { [key: string]: any }, values: any[]) => {
  let result = new Big(0);
  values.forEach(key => {
    const value = aggregations.find(
      (bucket: { get: (key: string) => any }) => bucket.get('key') === key
    );
    const filteredValue = value ? value.getIn(['filtered', 'doc_count']) : 0;
    result = result.plus(filteredValue || 0);
  });
  return Number(result);
};

export default {
  async fetch(markdown: string, requestParams: RequestParams) {
    const datasets = parseDatasets(markdown);
    return requestDatasets(datasets, requestParams).then(conformDatasets);
  },

  getRows(state: any, { dataset = 'default' }) {
    const data = state.page.datasets.get(dataset);
    if (!data) {
      return undefined;
    }
    return data.get('rows');
  },

  getAggregations,

  getAggregation(
    state: any,
    { uniqueValues, property, value, dataset = 'default' }: AggregationValues
  ) {
    const aggregations = getAggregations(state, { property, dataset });
    if (!aggregations) {
      return undefined;
    }

    if (uniqueValues) {
      return aggregations.filter(
        (bucket: { getIn: (key: string[]) => number }) =>
          bucket.getIn(['filtered', 'doc_count']) !== 0
      ).size;
    }

    const values = value ? value.split(',') : [''];
    return addValues(aggregations, values);
  },

  getMetadataValue(state: any, { property, dataset = 'default' }: AggregationValues) {
    const data = state.page.datasets.get(dataset);
    const propertyExists = data && data.hasIn(['metadata', property]);
    const mos = propertyExists ? data.getIn(['metadata', property]).toJS() : [];
    return mos && mos.length && mos[0].value ? Number(mos[0].value) : undefined;
  },
};
