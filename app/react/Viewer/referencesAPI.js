import api from 'app/utils/api';

export default {
  get(requestParams) {
    const start = performance.now();
    return api.get('references/by_document', requestParams).then(response => {
      console.log(
        '[PERF][ReferencesAPI] GET by_document:',
        (performance.now() - start).toFixed(2),
        'ms'
      );
      return response.json;
    });
  },

  getGroupedByConnection(requestParams) {
    const start = performance.now();
    return api.get('references/group_by_connection', requestParams).then(response => {
      console.log(
        '[PERF][ReferencesAPI] GET group_by_connection:',
        (performance.now() - start).toFixed(2),
        'ms'
      );
      return response.json;
    });
  },

  getInbound(requestParams) {
    const start = performance.now();
    return api.get('references/by_target/', requestParams).then(response => {
      console.log(
        '[PERF][ReferencesAPI] GET by_target:',
        (performance.now() - start).toFixed(2),
        'ms'
      );
      return response.json.rows;
    });
  },

  search(requestParams) {
    const start = performance.now();
    return api.get('references/search', requestParams).then(response => {
      console.log(
        '[PERF][ReferencesAPI] GET search:',
        (performance.now() - start).toFixed(2),
        'ms'
      );
      return response.json;
    });
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
