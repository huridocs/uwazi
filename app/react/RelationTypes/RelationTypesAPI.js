import api from 'app/utils/api';

export default {
  get(id) {
    let params = {};
    if (id) {
      params._id = id;
    }

    return api.get('relationtypes', params)
    .then((response) => {
      return response.json.rows;
    });
  },

  save(relationType) {
    return api.post('relationtypes', relationType)
    .then((response) => {
      return response.json;
    });
  },

  delete(relationType) {
    return api.delete('relationtypes', relationType)
    .then((response) => {
      return response.json;
    });
  }
};
