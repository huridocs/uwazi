import api from 'app/utils/api';

export default {
  get(source) {
    let url = 'references';
    if (source) {
      url += `?sourceDocument=${source}`;
    }
    return api.get(url)
    .then((response) => {
      return response.json.rows;
    });
  },

  getInbound(targetDocument) {
    return api.get(`references/by_target_document/${targetDocument}`)
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
    return api.delete('references', reference)
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
