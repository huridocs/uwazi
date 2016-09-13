import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'pages';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  list(keys) {
    let url = 'pages/list';
    return api.get(url, {keys: keys})
    .then((response) => {
      return response.json.rows;
    });
  },

  save(page) {
    return api.post('pages', page)
    .then((response) => {
      return response.json;
    });
  },

  delete(page) {
    return api.delete('pages', page)
    .then((response) => {
      return response.json;
    });
  }
};
