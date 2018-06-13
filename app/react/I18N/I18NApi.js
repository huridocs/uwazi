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
  }
};
