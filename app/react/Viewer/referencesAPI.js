import api from 'app/utils/api';

export default {
  get(documentId) {
    let url = `references/by_document/${documentId}`;
    return api.get(url).then((response) => response.json);
  },

  getGroupedByConnection(documentId) {
    let url = `references/group_by_connection/${documentId}`;
    return api.get(url).then((response) => response.json);
  },

  getInbound(targetDocument) {
    return api.get(`references/by_target/${targetDocument}`)
    .then((response) => {
      return response.json.rows;
    });
  },

  save(reference) {
    return api.post('references', reference)
    .then((response) => {
      return response.json;
    });
  },

  delete(reference) {
    const {_id, _rev} = reference;
    return api.delete('references', {_id, _rev})
    .then((response) => {
      return response.json;
    });
  },

  countByRelationType(relationtypeId) {
    return api.get('references/count_by_relationtype', {relationtypeId})
    .then((response) => {
      return response.json;
    });
  }
};
