import api from 'app/utils/api';

export default {
  get(id) {
    return api.get(`pages?sharedId=${id}`)
    .then(response => response.json);
  },

  list() {
    const url = 'pages/list';
    return api.get(url)
    .then(response => response.json.rows);
  },

  save(page) {
    return api.post('pages', page)
    .then(response => response.json);
  },

  delete(page) {
    return api.delete('pages', page)
    .then(response => response.json);
  }
};
