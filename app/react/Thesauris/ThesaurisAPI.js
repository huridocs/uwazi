import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'thesauris';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  getDictionaries(id) {
    let url = 'dictionaries';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  save(thesauri) {
    return api.post('thesauris', thesauri)
    .then((response) => {
      return response.json;
    });
  },

  delete(thesauri) {
    return api.delete('thesauris', thesauri)
    .then((response) => {
      return response.json;
    });
  }
};
