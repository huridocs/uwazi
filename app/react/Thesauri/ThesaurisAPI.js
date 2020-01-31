/** @format */

import api from 'app/utils/api';
import { CLASSIFIER_MODELS_ENDPOINT } from 'api/topicclassification/routes';

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
    return api.get(CLASSIFIER_MODELS_ENDPOINT, requestParams).then(response => response.json);
  },

  save(requestParams) {
    return api.post('thesauris', requestParams).then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('thesauris', requestParams).then(response => response.json);
  },
};
