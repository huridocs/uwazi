import api from 'app/utils/api';
import qs from 'query-string';

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
  getEntitiesMatchingFilters(searchId, args) {
    const query = args ? `?${qs.stringify(args)}` : '';
    const url = `semantic-search/${searchId}/list${query}`;
    return api.get(url).then(response => response.json);
  },
  getSearch(searchId, args) {
    const query = args ? `?${qs.stringify(args)}` : '';
    const url = `semantic-search/${searchId}${query}`;
    return api.get(url).then(response => response.json);
  },
  deleteSearch(searchId) {
    const url = `semantic-search/${searchId}`;
    return api.delete(url).then(response => response.json);
  },
  stopSearch(searchId) {
    const url = `semantic-search/${searchId}/stop`;
    return api.post(url).then(response => response.json);
  },
  resumeSearch(searchId) {
    const url = `semantic-search/${searchId}/resume`;
    return api.post(url).then(response => response.json);
  },
  registerForUpdates() {
    const url = 'semantic-search/notify-updates';
    return api.post(url).then(response => response.json);
  }
};
