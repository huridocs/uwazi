import api from 'app/utils/api';
import EntitiesApi from '../Entities/EntitiesAPI';

export default {
  get(id) {
    return EntitiesApi.get(id);
  },

  countByTemplate(templateId) {
    let url = `documents/count_by_template?templateId=${templateId}`;
    return api.get(url)
    .then((response) => {
      return response.json;
    });
  },

  uploads() {
    let url = 'documents/uploads';
    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  search(filters) {
    let url = 'documents/search';
    return api.get(url, filters)
    .then((response) => {
      return response.json;
    });
  },

  getSuggestions(searchTerm) {
    let url = 'documents/match_title?searchTerm=' + (searchTerm || '');
    return api.get(url)
    .then((response) => {
      return response.json;
    });
  },

  list(keys) {
    let url = 'documents/list';
    return api.get(url, {keys: keys})
    .then((response) => {
      return response.json.rows;
    });
  },

  save(doc) {
    return api.post('documents', doc)
    .then((response) => {
      return response.json;
    });
  },

  delete(doc) {
    return api.delete('documents', {sharedId: doc.sharedId})
    .then((response) => {
      return response.json;
    });
  }
};
