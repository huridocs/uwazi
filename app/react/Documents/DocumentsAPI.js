import api from 'app/utils/api';
import EntitiesApi from '../Entities/EntitiesAPI';

export default {
  get(requestParams) {
    return EntitiesApi.get(requestParams);
  },

  countByTemplate(requestParams) {
    const url = 'documents/count_by_template';
    return api.get(url, requestParams).then(response => response.json);
  },

  uploads() {
    const url = 'documents/uploads';
    return api.get(url).then(response => response.json.rows);
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
