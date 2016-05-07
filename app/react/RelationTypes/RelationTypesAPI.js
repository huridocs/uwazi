import api from 'app/utils/api';

export default {
  get(id) {
    let params = {};
    if (id) {
      params._id = id;
    }

    return api.get('relationtypes', params)
    .then((response) => {
      return response.json;
    });
  },

  save(thesauri) {
    return api.post('relationtypes', thesauri)
    .then((response) => {
      return response.json;
    });
  },

  delete(thesauri) {
    return api.delete('relationtypes', thesauri)
    .then((response) => {
      return response.json;
    });
  }
};
