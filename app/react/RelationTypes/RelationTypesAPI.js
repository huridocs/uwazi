import api from 'app/utils/api';

export default {
  get(request) {
    return api.get('relationtypes', request).then(response => response.json.rows);
  },

  save(request) {
    return api.post('relationtypes', request).then(response => response.json);
  },

  delete(request) {
    return api.delete('relationtypes', request).then(response => response.json);
  },
};
