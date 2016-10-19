import api from 'app/utils/api';

export default {
  get(id) {
    return api.get(`pages?sharedId=${id}`)
    .then((response) => {
      return response.json;
    });
  },

  list() {
    let url = 'pages/list';
    return api.get(url)
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
