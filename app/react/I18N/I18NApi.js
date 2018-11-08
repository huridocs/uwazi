import api from 'app/utils/api';

export default {
  get() {
    return api.get('translations')
    .then(response => response.json.rows);
  },

  save(translation) {
    return api.post('translations', translation)
    .then(response => response.json);
  },

  addEntry(context, key, value) {
    return api.post('translations/addentry', { context, key, value })
    .then(response => response.json);
  },

  addLanguage(label, key) {
    return api.post('translations/languages', { label, key })
    .then(response => response.json);
  },

  deleteLanguage(key) {
    return api.delete('translations/languages', { key })
    .then(response => response.json);
  },

  setDefaultLanguage(key) {
    return api.post('translations/setasdeafult', { key })
    .then(response => response.json);
  }
};
