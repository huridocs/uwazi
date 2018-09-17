import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'templates';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then(response => response.json.rows);
  },

  save(template) {
    return api.post('templates', template)
    .then(response => response.json);
  },

  countByThesauri(thesauri) {
    return api.get('templates/count_by_thesauri', { _id: thesauri._id })
    .then(response => response.json);
  },

  delete(template) {
    return api.delete('templates', { _id: template._id })
    .then(response => response.json);
  }
};
