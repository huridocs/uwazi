import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'entities';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  countByTemplate(templateId) {
    let url = `entities/count_by_template?templateId=${templateId}`;
    return api.get(url)
    .then((response) => {
      return response.json;
    });
  },

  uploads() {
    let url = 'entities/uploads';
    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  search(filters) {
    let url = 'entities/search';
    return api.get(url, filters)
    .then((response) => {
      return response.json;
    });
  },

  getSuggestions(searchTerm) {
    let url = 'entities/match_title?searchTerm=' + (searchTerm || '');
    return api.get(url)
    .then((response) => {
      return response.json;
    });
  },

  save(entity) {
    return api.post('entities', entity)
    .then((response) => {
      return response.json;
    });
  },

  multipleUpdate(ids, values) {
    return api.post('entities/multipleupdate', {ids, values})
    .then((response) => {
      return response.json;
    });
  },

  delete(entity) {
    return api.delete('entities', entity)
    .then((response) => {
      return response.json;
    });
  },

  deleteMultiple(entities) {
    return api.delete('entities/multiple', {sharedIds: entities.map((entity) => entity.sharedId)})
    .then((response) => {
      return response.json;
    });
  }
};
