/** @format */

import api from 'app/utils/api';

export default {
  get(requestParams) {
    return api.get('entities', requestParams).then(response => response.json.rows);
  },

  countByTemplate(requestParams) {
    const url = 'entities/count_by_template';
    return api.get(url, requestParams).then(response => response.json);
  },

  async getRawPage(requestParams) {
    const response = await api.get(
      'documents/page',
      requestParams.add({ page: requestParams.data.page || 1 })
    );
    return response.json.data;
  },

  uploads() {
    const url = 'entities/uploads';
    return api.get(url).then(response => response.json.rows);
  },

  search(requestParams) {
    const url = 'entities/search';
    return api.get(url, requestParams).then(response => response.json);
  },

  getSuggestions(requestParams) {
    const url = 'entities/match_title';
    return api.get(url, requestParams).then(response => response.json);
  },

  save(requestParams) {
    return api.post('entities', requestParams).then(response => response.json);
  },

  denormalize(requestParams) {
    return api.post('entity_denormalize', requestParams).then(response => response.json);
  },

  multipleUpdate(requestParams) {
    return api.post('entities/multipleupdate', requestParams).then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('entities', requestParams).then(response => response.json);
  },

  deleteMultiple(requestParams) {
    return api.post('entities/bulkdelete', requestParams).then(response => response.json);
  },
};
