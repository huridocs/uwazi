import api from 'app/utils/api';

export default {
  get(requestParams) {
    return api.get('translations', requestParams).then(response => response.json.rows);
  },

  save(requestParams) {
    return api.post('translations', requestParams).then(response => response.json);
  },

  addEntry(requestParams) {
    return api.post('translations/addentry', requestParams).then(response => response.json);
  },

  addLanguage(requestParams) {
    return api.post('translations/languages', requestParams).then(response => response.json);
  },

  deleteLanguage(requestParams) {
    return api.delete('translations/languages', requestParams).then(response => response.json);
  },

  setDefaultLanguage(requestParams) {
    return api.post('translations/setasdeafult', requestParams).then(response => response.json);
  },

  getLanguages: async requestParams => {
    const { json: response } = await api.get('languages', requestParams);
    return response;
  },

  populateTranslations: async requestParams => {
    const { json: response } = await api.post('translations/populate', requestParams);
    return response;
  },
};
