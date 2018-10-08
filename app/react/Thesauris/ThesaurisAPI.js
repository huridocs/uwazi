import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'thesauris';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then(response => response.json.rows);
  },

  getDictionaries(id) {
    let url = 'dictionaries';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then(response => response.json.rows);
  },

  getEntities() {
    const url = '/thesauris/entities';

    return api.get(url)
    .then(response => response.json.rows);
  },

  save(thesauri) {
    return api.post('thesauris', thesauri)
    .then(response => response.json);
  },

  delete(thesauri) {
    return api.delete('thesauris', { _id: thesauri._id })
    .then(response => response.json);
  }
};
