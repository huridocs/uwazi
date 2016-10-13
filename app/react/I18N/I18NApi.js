import api from 'app/utils/api';

export default {
  get() {
    return api.get('i18N/translations')
    .then((response) => {
      return response.json.rows;
    });
  },

  save(translation) {
    return api.post('i18N/translations', translation)
    .then((response) => {
      return response.json;
    });
  }
};
