import api from 'app/utils/api';

export default {
  save(user) {
    return api.post('users', user)
    .then((response) => {
      return response.json;
    });
  },

  new(user) {
    return api.post('users/new', user)
    .then((response) => {
      return response.json;
    });
  },

  currentUser() {
    return api.get('user')
    .then((response) => {
      return response.json;
    });
  },

  list() {
    return api.get('users')
    .then((response) => {
      return response.json;
    });
  },

  getById(_id) {
    return api.get('users', {_id})
    .then((response) => {
      return response.json[0];
    });
  },

  delete(user) {
    return api.delete('users', user)
    .then((response) => {
      return response.json;
    });
  }
};
