import api from 'app/utils/api';

export default {
  get(requestParams) {
    return api.get('references/by_document', requestParams).then(response => response.json);
  },

  getGroupedByConnection(requestParams) {
    return api.get('references/group_by_connection', requestParams).then(response => response.json);
  },

  getInbound(requestParams) {
    return api.get('references/by_target/', requestParams).then(response => response.json.rows);
  },

  search(requestParams) {
    return api.get('references/search', requestParams).then(response => response.json);
  },

  save(requestParams) {
    return api.post('references', requestParams).then(response => response.json);
  },

  delete(requestParams) {
    return api.delete('references', requestParams).then(response => response.json);
  },

  countByRelationType(requestParams) {
    return api
      .get('references/count_by_relationtype', requestParams)
      .then(response => response.json);
  },
};
