import api from 'app/utils/singleton_api';

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

  search(searchTerm, filters = {}) {
    filters.searchTerm = searchTerm;
    let url = 'documents/search?' + this.toParams(filters);
    return api.get(url)
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
  },

  toParams(data) {
    return Object.keys(data).reduce((params, key) => {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key] || ''));
      return params;
    }, []).join('&');
  }
};
