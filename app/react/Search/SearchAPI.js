import api from 'app/utils/api';

export default {

  countByTemplate(templateId) {
    const url = `search/count_by_template?templateId=${templateId}`;
    return api.get(url)
    .then(response => response.json);
  },

  unpublished() {
    const url = 'search/unpublished';
    return api.get(url)
    .then(response => response.json.rows);
  },

  searchSnippets(searchTerm, sharedId) {
    const url = 'search_snippets';
    return api.get(url, { searchTerm, id: sharedId })
    .then(response => response.json);
  },

  search(filters) {
    const url = 'search';
    return api.get(url, filters)
    .then(response => response.json);
  },

  getSuggestions(searchTerm) {
    const url = `search/match_title?searchTerm=${searchTerm || ''}`;
    return api.get(url)
    .then(response => response.json);
  },

  list(keys) {
    const url = 'search/list';
    return api.get(url, { keys })
    .then(response => response.json.rows);
  }
};
