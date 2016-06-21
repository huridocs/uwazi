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
  }
};
