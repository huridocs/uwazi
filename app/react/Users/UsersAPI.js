import api from 'app/utils/api';

export default {
  save(requestParams) {
    return api.post('users', requestParams).then(response => response.json);
  },

  new(requestParams) {
    return api.post('users/new', requestParams).then(response => response.json);
  },

  unlockAccount(requestParams) {
    return api.post('users/unlock', requestParams).then(response => response.json);
  },

  currentUser(requestParams) {
    return api.get('user', requestParams).then(response => response.json);
  },

  get(requestParams) {
    return api.get('users', requestParams).then(response => response.json);
  },

  getById(requestParams) {
    return api.get('users', requestParams).then(response => response.json[0]);
  },

  delete(requestParams) {
    return api.delete('users', requestParams).then(response => response.json);
  },
};
