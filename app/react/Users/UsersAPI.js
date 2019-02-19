import api from 'app/utils/api';

export default {
  save(user) {
    return api.post('users', user)
    .then(response => response.json);
  },

  new(user) {
    return api.post('users/new', user)
    .then(response => response.json);
  },

  currentUser() {
    return api.get('user')
    .then(response => response.json);
  },

  list() {
    return api.get('users')
    .then(response => response.json);
  },

  getById(_id) {
    return api.get('users', { _id })
    .then(response => response.json[0]);
  },

  delete(user) {
    return api.delete('users', user)
    .then(response => response.json);
  }
};
