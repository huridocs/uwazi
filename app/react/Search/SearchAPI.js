import api from 'app/utils/api';

export default {
  countByTemplate(requestParams) {
    const url = 'search/count_by_template';
    return api.get(url, requestParams).then(response => response.json);
  },

  unpublished() {
    const url = 'search/unpublished';
    return api.get(url).then(response => response.json.rows);
  },

  searchSnippets(requestParams) {
    const url = 'search_snippets';
    return api.get(url, requestParams).then(response => response.json);
  },

  search(requestParams) {
    return api.get('search', requestParams).then(response => response.json);
  },

  getSuggestions(requestParams) {
    const url = 'search/match_title';
    return api.get(url, requestParams).then(response => response.json);
  },

  list(requestParams) {
    const url = 'search/list';
    return api.get(url, requestParams).then(response => response.json.rows);
  },
};
