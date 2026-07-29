import { api } from '#app/utils/api.js';
import { EntitiesAPI } from '../Entities/EntitiesAPI.js';

const documentsAPI = {
  get(requestParams) {
    return EntitiesAPI.get(requestParams);
  },

  countByTemplate(requestParams) {
    const url = 'documents/count_by_template';
    return api.get(url, requestParams).then(response => response.json);
  },

  search(requestParams) {
    const url = 'documents/search';
    return api.get(url, requestParams).then(response => response.json);
  },

  list(requestParams) {
    const url = 'documents/list';
    return api.get(url, requestParams).then(response => response.json.rows);
  },

  save(requestParams) {
    return api.post('documents', requestParams).then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('documents', requestParams).then(response => response.json);
  },
};
export { documentsAPI };
