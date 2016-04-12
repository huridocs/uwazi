import api from 'app/utils/singleton_api';

export default {
  get(id) {
    let url = 'documents';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  save(thesauri) {
    return api.post('documents', thesauri)
    .then((response) => {
      return response.json;
    });
  },

  delete(thesauri) {
    return api.delete('documents', thesauri)
    .then((response) => {
      return response.json;
    });
  }
};
