import api from 'app/utils/api';
import EntitiesApi from '../Entities/EntitiesAPI';

export default {
  get(id) {
    return EntitiesApi.get(id);
  },

  countByTemplate(templateId) {
    const url = `documents/count_by_template?templateId=${templateId}`;
    return api.get(url)
    .then(response => response.json);
  },

  uploads() {
    const url = 'documents/uploads';
    return api.get(url)
    .then(response => response.json.rows);
  },

  search(filters) {
    const url = 'documents/search';
    return api.get(url, filters)
    .then(response => response.json);
  },

  getSuggestions(searchTerm) {
    const url = `documents/match_title?searchTerm=${searchTerm || ''}`;
    return api.get(url)
    .then(response => response.json);
  },

  list(keys) {
    const url = 'documents/list';
    return api.get(url, { keys })
    .then(response => response.json.rows);
  },

  save(doc) {
    return api.post('documents', doc)
    .then(response => response.json);
  },

  delete(doc) {
    return api.delete('documents', { sharedId: doc.sharedId })
    .then(response => response.json);
  }
};
