import api from 'app/utils/api';

export default {
  save(settings) {
    return api.post('settings', settings)
    .then(response => response.json);
  },

  get() {
    return api.get('settings')
    .then(response => response.json);
  }
};
