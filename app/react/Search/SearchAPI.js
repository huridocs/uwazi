import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

export default {
  countByTemplate(requestParams) {
    const url = 'search/count_by_template';
    return api.get(url, requestParams).then(response => response.json);
  },

  searchSnippets(requestParams) {
    return api.get('v2/search', requestParams).then(response => response.json);
  },

  search(requestParams = new RequestParams()) {
    const params = requestParams.add({
      include:
        requestParams.data && requestParams.data.include
          ? requestParams.data.include.concat(['permissions'])
          : ['permissions'],
    });
    return api.get('search', params).then(response => response.json);
  },

  list(requestParams) {
    const url = 'search/list';
    return api.get(url, requestParams).then(response => response.json.rows);
  },

  getSuggestions(requestParams) {
    const url = 'search/lookup';
    return api.get(url, requestParams).then(response => response.json);
  },

  getAggregationSuggestions(requestParams) {
    const url = 'search/lookupaggregation';
    return api.get(url, requestParams).then(response => response.json);
  },
};
