import api from 'app/utils/api';

export default {
  save(settings) {
    return api.post('settings', settings).then(response => response.json);
  },

  get(query, headers) {
    return api.get('settings', query, headers).then(response => response.json);
  },
};
