import api from 'app/utils/api';

export default {
  get(request) {
    const url = 'templates';
    return api.get(url, request).then(response => response.json.rows);
  },

  save(request) {
    return api.post('templates', request).then(response => response.json);
  },

  setAsDefault(request) {
    return api.post('templates/setasdefault', request).then(response => response.json);
  },

  countByThesauri(request) {
    return api.get('templates/count_by_thesauri', request).then(response => response.json);
  },

  delete(request) {
    return api.delete('templates', request).then(response => response.json);
  },
};
