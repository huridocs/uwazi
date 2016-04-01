import api from '~/utils/singleton_api';

export default {
  get() {
    return api.get('templates')
    .then((response) => {
      return response.json.rows;
    });
  },

  save(template) {
    return api.post('templates', template)
    .then((response) => {
      return response.json;
    });
  },

  delete(id, rev) {
    return api.delete('templates', {_id: id, _rev: rev})
    .then((response) => {
      return response.json;
    });
  }
};
