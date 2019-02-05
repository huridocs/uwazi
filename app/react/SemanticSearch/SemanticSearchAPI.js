import api from 'app/utils/api';

export default {
  search(args) {
    const url = 'semantic-search';
    return api.post(url, args)
    .then(response => response.json);
  },
  getAllSearches() {
    const url = 'semantic-search';
    return api.get(url)
    .then(response => response.json);
  },
  getSearch(searchId) {
    const url = `semantic-search/${searchId}`;
    return api.get(url).then(response => response.json);
  },
  getSearchResults(searchId) {
    const url = `semantic-search/${searchId}/results`;
    return api.get(url)
    .then(response => response.json);
  }
};

