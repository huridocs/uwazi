import api from 'app/utils/api';

export default {

  countByTemplate(templateId) {
    let url = `search/count_by_template?templateId=${templateId}`;
    return api.get(url)
    .then((response) => {
      return response.json;
    });
  },

  unpublished() {
    let url = 'search/unpublished';
    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  searchSnippets(searchTerm, sharedId) {
    let url = 'search_snippets';
    return api.get(url, {searchTerm, id: sharedId})
    .then((response) => {
      return response.json;
    });
  },

  search(filters) {
    let url = 'search';
    return api.get(url, filters)
    .then((response) => {
      return response.json;
    });
  },

  getSuggestions(searchTerm) {
    let url = 'search/match_title?searchTerm=' + (searchTerm || '');
    return api.get(url)
    .then((response) => {
      return response.json;
    });
  },

  list(keys) {
    let url = 'search/list';
    return api.get(url, {keys: keys})
    .then((response) => {
      return response.json.rows;
    });
  }
};
