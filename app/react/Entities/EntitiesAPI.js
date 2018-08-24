import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'entities';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then(response => response.json.rows);
  },

  countByTemplate(templateId) {
    const url = `entities/count_by_template?templateId=${templateId}`;
    return api.get(url)
    .then(response => response.json);
  },

  async getRawPage(sharedId, pageNumber = 1) {
    const response = await api.get('entities/get_raw_page', { sharedId, pageNumber });
    return response.json.data;
  },

  uploads() {
    const url = 'entities/uploads';
    return api.get(url)
    .then(response => response.json.rows);
  },

  search(filters) {
    const url = 'entities/search';
    return api.get(url, filters)
    .then(response => response.json);
  },

  getSuggestions(searchTerm) {
    const url = `entities/match_title?searchTerm=${searchTerm || ''}`;
    return api.get(url)
    .then(response => response.json);
  },

  save(entity) {
    return api.post('entities', entity)
    .then(response => response.json);
  },

  multipleUpdate(ids, values) {
    return api.post('entities/multipleupdate', { ids, values })
    .then(response => response.json);
  },

  delete(entity) {
    return api.delete('entities', { sharedId: entity.sharedId })
    .then(response => response.json);
  },

  deleteMultiple(entities) {
    return api.delete('entities/multiple', { sharedIds: entities.map(entity => entity.sharedId) })
    .then(response => response.json);
  }
};
