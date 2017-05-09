import api from 'app/utils/api';

export default {
  save(user) {
    return api.post('users', user)
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

  delete(user) {
    return api.delete('users', user)
    .then((response) => {
      return response.json;
    });
  }
};
