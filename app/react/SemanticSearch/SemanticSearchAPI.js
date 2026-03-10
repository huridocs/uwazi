import api from 'app/utils/api';

export default {
  search(requestParams) {
    const url = 'semantic-search';
    return api.post(url, requestParams).then(response => response.json);
  },
  getAllSearches(requestParams) {
    const url = 'semantic-search';
    return api.get(url, requestParams).then(response => response.json);
  },
  getEntitiesMatchingFilters(requestParams) {
    const url = 'semantic-search/list';
    return api.get(url, requestParams).then(response => response.json);
  },
  getSearch(requestParams) {
    const url = 'semantic-search';
    return api.get(url, requestParams).then(response => response.json);
  },
  deleteSearch(requestParams) {
    const url = 'semantic-search';
    return api.delete(url, requestParams).then(response => response.json);
  },
  stopSearch(requestParams) {
    const url = 'semantic-search/stop';
    return api.post(url, requestParams).then(response => response.json);
  },
  resumeSearch(requestParams) {
    const url = 'semantic-search/resume';
    return api.post(url, requestParams).then(response => response.json);
  },
  registerForUpdates(requestParams) {
    const url = 'semantic-search/notify-updates';
    return api.post(url, requestParams).then(response => response.json);
  },
};
