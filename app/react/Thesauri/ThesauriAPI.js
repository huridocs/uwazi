import api from 'app/utils/api';

export default {
  get(requestParams) {
    const url = 'thesauris';
    return api.get(url, requestParams).then(response => response.json.rows);
  },

  getThesauri(requestParams) {
    const url = 'dictionaries';
    return api.get(url, requestParams).then(response => response.json.rows);
  },

  getModelStatus(requestParams) {
    return api.get('models', requestParams).then(response => response.json);
  },

  getModelTrainStatus(requestParams) {
    return api.get('models/train', requestParams).then(response => response.json);
  },

  trainModel(requestParams) {
    return api.post('models/train', requestParams).then(response => response.json);
  },

  save(requestParams) {
    return api.post('thesauris', requestParams).then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('thesauris', requestParams).then(response => response.json);
  },
};
