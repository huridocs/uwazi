import api from 'app/utils/api';

export default {
  get(requestParams) {
    return api.get('pages', requestParams).then(response => response.json);
  },

  getById(requestParams) {
    return api.get('page', requestParams).then(response => response.json);
  },

  save(requestParams) {
    return api.post('pages', requestParams).then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('pages', requestParams).then(response => response.json);
  },
};
