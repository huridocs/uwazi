import api from 'app/utils/api';

export default {
  get(id) {
    let url = 'documents';
    if (id) {
      url += `?_id=${id}`;
    }

    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
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

  save(thesauri) {
    return api.post('documents', thesauri)
    .then((response) => {
      return response.json;
    });
  },

  delete(thesauri) {
    return api.delete('documents', thesauri)
    .then((response) => {
      return response.json;
    });
  }
};
