import api from 'app/utils/api';

export default {
  get(requestParams) {
    const url = 'thesauris';
    return api.get(url, requestParams)
    .then(response => response.json.rows);
  },

  getDictionaries(requestParams) {
    const url = 'dictionaries';
    return api.get(url, requestParams)
    .then(response => response.json.rows);
  },

  save(requestParams) {
    return api.post('thesauris', requestParams)
    .then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('thesauris', requestParams)
    .then(response => response.json);
  }
};
