import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'templates';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
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

  countByThesauri(thesauri) {
    return api.get('templates/count_by_thesauri', thesauri)
    .then((response) => {
      return response.json;
    });
  },

  delete(template) {
    return api.delete('templates', template)
    .then((response) => {
      return response.json;
    });
  }
};
