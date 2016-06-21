import api from 'app/utils/api';

export default {
  save(settings) {
    return api.post('settings', settings)
    .then((response) => {
      return response.json;
    });
  },

  get() {
    return api.get('settings')
    .then((response) => {
      return response.json;
    });
  }
};
