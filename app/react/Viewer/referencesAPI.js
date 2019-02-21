import api from 'app/utils/api';

export default {
  get(documentId) {
    const url = `references/by_document/${documentId}`;
    return api.get(url).then(response => response.json);
  },

  getGroupedByConnection(documentId) {
    const url = `references/group_by_connection/${documentId}`;
    return api.get(url).then(response => response.json);
  },

  getInbound(targetDocument) {
    return api.get(`references/by_target/${targetDocument}`)
    .then(response => response.json.rows);
  },

  search(documentId, options = {}) {
    return api.get(`references/search/${documentId}`, options)
    .then(response => response.json);
  },

  save(reference) {
    return api.post('references', reference)
    .then(response => response.json);
  },

  delete(reference) {
    const { _id } = reference;
    return api.delete('references', { _id })
    .then(response => response.json);
  },

  countByRelationType(relationtypeId) {
    return api.get('references/count_by_relationtype', { relationtypeId })
    .then(response => response.json);
  }
};
