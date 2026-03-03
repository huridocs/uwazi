import { api } from '#app/utils/api.js';

const relationTypesApi = {
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

export default relationTypesApi;
export { relationTypesApi as api };
